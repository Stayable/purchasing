import { useProcurement } from "./useProcurement.js";
import LoginScreen from "./auth/LoginScreen.jsx";
import Shell from "./components/Shell.jsx";

export default function App() {
  const { data, status, reload } = useProcurement();

  if (status === "unauth") return <LoginScreen onAuthed={reload} />;
  if (status === "loading") return <div className="center">Loading…</div>;
  if (status === "error")
    return (
      <div className="center">
        Couldn&apos;t reach the server.{" "}
        <button onClick={reload}>Retry</button>
      </div>
    );
  return <Shell data={data} reload={reload} />;
}
