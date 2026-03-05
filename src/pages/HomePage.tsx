import AuthButton from "../components/AuthButton/AuthButton";
import { getStoredTokens } from "../services/spotify/auth";

export default function HomePage() {
    const tokens = getStoredTokens();
    return (
        <div style={{ padding: 24 }}>
            <h1>Playlist Engine</h1>
            <AuthButton />
            <p>{tokens ? "✅ Logged in" : "❌ Not logged in"}</p>
        </div>
    );
}