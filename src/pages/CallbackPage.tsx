import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finishSpotifyLogin } from "../services/spotify/auth";

export default function CallbackPage() {
  const [status, setStatus] = useState("Finishing Spotify login...");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await finishSpotifyLogin(window.location.search);
        setStatus("Success! Redirecting...");
        navigate("/", { replace: true });
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Login failed.");
      }
    })();
  }, [navigate]);

  return <div style={{ padding: 24 }}>{status}</div>;
}