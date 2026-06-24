import { Link } from "react-router-dom";
import { formatUSD } from "../money.js";

const CARDS = [
  { to: "/queue",     icon: "◎", title: "Approval Queue",   desc: "Items submitted and awaiting a decision." },
  { to: "/items",     icon: "≡", title: "Items",            desc: "All procurement items, quotes, and vendor comms." },
  { to: "/board",     icon: "⊞", title: "Board",            desc: "Pipeline as a stage-by-stage board." },
  { to: "/tracker",   icon: "↻", title: "Tracker",          desc: "Pipeline by stage with counts and flags." },
  { to: "/decisions", icon: "✓", title: "Decisions",        desc: "Log of awarded, approved, and declined items." },
  { to: "/spend",     icon: "$", title: "Spend",            desc: "Pending vs approved spend rollup." },
  { to: "/how-it-works",  icon: "◷", title: "How it works", desc: "The procurement operating model and workflow." },
  { to: "/architecture",  icon: "▤", title: "Architecture", desc: "How the system is structured in Zoho." },
];

export default function HomeView({ data }) {
  const viewer = data?.viewer;
  const itemCount = data?.items?.length ?? 0;
  const pending = data?.spend?.pendingSubmitted;

  return (
    <section className="view-pane">
      <div className="home-hero">
        <h2 className="home-title">Stayable Procurement</h2>
        <p className="home-sub">
          {viewer ? `Signed in as ${viewer}. ` : ""}
          {itemCount} item{itemCount !== 1 ? "s" : ""} in the pipeline
          {pending != null ? ` · ${formatUSD(pending)} pending approval` : ""}.
        </p>
      </div>
      <div className="home-grid">
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="home-card">
            <span className="home-card-icon">{c.icon}</span>
            <span className="home-card-title">{c.title}</span>
            <span className="home-card-desc">{c.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
