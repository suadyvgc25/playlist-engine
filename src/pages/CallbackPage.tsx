import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finishSpotifyLogin } from "../services/spotify/auth";

export default function CallbackPage() {
  const [status, setStatus] = useState("Finishing Spotify login...");
  const navigate = useNavigate();

  // Guard the OAuth exchange so development Strict Mode does not spend the same code twice.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function handleLogin() {
      try {
        await finishSpotifyLogin(window.location.search);

        // Keep the app URL clean after the one-time Spotify callback has been processed.
        window.history.replaceState({}, document.title, import.meta.env.BASE_URL);

        setStatus("Success! Redirecting...");
        navigate("/", { replace: true });

      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Login failed.");
      }
    }

    handleLogin();
  }, [navigate]);

  return <div style={{ padding: 24 }}>{status}</div>;
}
