import { startSpotifyLogin } from "../../services/spotify/auth";

export default function AuthButton() {
  return (
    <button onClick={() => void startSpotifyLogin()}>
      Log in with Spotify
    </button>
  );
}