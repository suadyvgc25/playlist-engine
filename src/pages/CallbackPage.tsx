import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finishSpotifyLogin } from "../services/spotify/auth";

export default function CallbackPage() {
  const [status, setStatus] = useState("Finishing Spotify login...");
  const navigate = useNavigate();

  // React Strict Mode can run effects twice during development.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function handleLogin() {
      try {
        await finishSpotifyLogin(window.location.search);

        // Drop the temporary OAuth params before returning to the app.
        window.history.replaceState({}, document.title, "/");

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
