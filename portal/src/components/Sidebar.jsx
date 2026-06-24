import { NavLink } from "react-router-dom";
import { logout } from "../api.js";

const NAV = [
  { to: "/",          label: "Home",      icon: "⌂", end: true },
  { to: "/queue",     label: "Queue",     icon: "◎" },
  { to: "/board",     label: "Board",     icon: "⊞" },
  { to: "/items",     label: "Items",     icon: "≡" },
  { to: "/tracker",   label: "Tracker",   icon: "↻" },
  { to: "/decisions", label: "Decisions", icon: "✓" },
  { to: "/spend",     label: "Spend",     icon: "$" },
];
const NAV_ABOUT = [
  { to: "/how-it-works", label: "How it works", icon: "◷" },
  { to: "/architecture", label: "Architecture", icon: "▤" },
];

export default function Sidebar({ viewer, onSignOut }) {
  async function handleSignOut(e) {
    e.preventDefault();
    try { await logout(); } catch { /* ignore */ }
    onSignOut();
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">S8</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">Stayable</div>
          <div className="sidebar-brand-sub">Procurement</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Views</div>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " active" : "")
            }
          >
            <span className="sidebar-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
        <div className="sidebar-section-label">About</div>
        {NAV_ABOUT.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " active" : "")
            }
          >
            <span className="sidebar-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {viewer && (
          <div className="sidebar-viewer">
            <div className="sidebar-viewer-avatar">
              {viewer.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-viewer-info">
              <div className="sidebar-viewer-email">{viewer}</div>
              <button className="sidebar-signout" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
