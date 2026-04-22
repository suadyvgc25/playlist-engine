const ITUNES_SEARCH_URL =
  "https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/wsSearch";

export async function fetchITunesJson(url, redirectCount = 0) {
  if (redirectCount > 3) {
    return { results: [] };
  }

  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) {
      return { results: [] };
    }

    const nextUrl = location.startsWith("musics://")
      ? `https://${location.slice("musics://".length)}`
      : new URL(location, url).toString();

    return fetchITunesJson(nextUrl, redirectCount + 1);
  }

  if (!response.ok) {
    return { results: [] };
  }

  return response.json();
}

export default async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url ?? "", "http://localhost");
    const appleUrl = new URL(`${ITUNES_SEARCH_URL}${requestUrl.search}`);
    appleUrl.searchParams.set("output", "json");
    const data = await fetchITunesJson(appleUrl.toString());

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (error) {
    console.warn("iTunes preview proxy failed", error);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ results: [] }));
  }
}
