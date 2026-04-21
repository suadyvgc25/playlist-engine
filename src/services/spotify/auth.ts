const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string;
const SCOPES = (import.meta.env.VITE_SPOTIFY_SCOPES as string)
  .split(" ")
  .filter(Boolean);

const storage = sessionStorage;

const VERIFIER_KEY = "spotify_pkce_verifier";
const STATE_KEY = "spotify_oauth_state";
const TOKENS_KEY = "spotify_tokens";

type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
};

function randomString(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function base64UrlEncode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sha256(plain: string) {
  const data = new TextEncoder().encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

async function createPkcePair() {
  const verifier = randomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));
  return { verifier, challenge };
}

export async function startSpotifyLogin() {
  const state = randomString(16);
  const { verifier, challenge } = await createPkcePair();

  storage.setItem(VERIFIER_KEY, verifier);
  storage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.assign(`${AUTH_URL}?${params.toString()}`);
}

export function getStoredTokens(): StoredTokens | null {
  const raw = storage.getItem(TOKENS_KEY);
  return raw ? (JSON.parse(raw) as StoredTokens) : null;
}

function setStoredTokens(tokens: StoredTokens) {
  storage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export async function finishSpotifyLogin(search: string) {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const returnedState = params.get("state");
  const error = params.get("error");

  if (error) throw new Error(`Spotify error: ${error}`);
  if (!code) throw new Error("Missing authorization code.");

  const expectedState = storage.getItem(STATE_KEY);
  if (!expectedState || returnedState !== expectedState) {
    throw new Error("Invalid state. Please try again.");
  }

  const verifier = storage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier. Please try again.");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as TokenResponse;

  setStoredTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  });

  // PKCE values should only be valid for this login attempt.
  storage.removeItem(VERIFIER_KEY);
  storage.removeItem(STATE_KEY);
}

export function isTokenExpired(tokens: StoredTokens) {
  return Date.now() > tokens.expiresAt - 60_000;
}

export async function refreshAccessToken() {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) throw new Error("No refresh token available.");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
    client_id: CLIENT_ID,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as TokenResponse;

  setStoredTokens({
    ...tokens,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    scope: data.scope ?? tokens.scope,
  });
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) return null;

  if (isTokenExpired(tokens)) {
    await refreshAccessToken();
    return getStoredTokens()!.accessToken;
  }

  return tokens.accessToken;
}

export async function requireAccessToken(): Promise<string> {
  const token = await getValidAccessToken();
  if (!token) throw new Error("User not logged in to Spotify.");
  return token;
}

export function logout() {
  sessionStorage.removeItem(TOKENS_KEY);
}
