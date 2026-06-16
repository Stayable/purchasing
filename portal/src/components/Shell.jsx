import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import KpiRow from "./KpiRow.jsx";
import QueueView from "../views/QueueView.jsx";
import BoardView from "../views/BoardView.jsx";
import ItemsView from "../views/ItemsView.jsx";
import DecisionsView from "../views/DecisionsView.jsx";
import SpendView from "../views/SpendView.jsx";

export default function Shell({ data, reload }) {
  return (
    <div className="shell">
      <Sidebar viewer={data?.viewer} onSignOut={reload} />
      <main className="main">
        <KpiRow spend={data?.spend} counts={data?.counts} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/queue" replace />} />
            <Route path="/queue"     element={<QueueView     data={data} reload={reload} />} />
            <Route path="/board"     element={<BoardView     data={data} reload={reload} />} />
            <Route path="/items"     element={<ItemsView     data={data} reload={reload} />} />
            <Route path="/decisions" element={<DecisionsView data={data} reload={reload} />} />
            <Route path="/spend"     element={<SpendView     data={data} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
