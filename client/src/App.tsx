import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import CreateNotePage from "./pages/CreateNotePage";
import ListNotePage from "./pages/ListNotePage";
import "./styles.css";

export default function App() {
  return (
    <div className="page-container">
      <div className="tabs">
        <NavLink to="/create" className={({ isActive }) => "tab-btn" + (isActive ? " active" : "")}>
          Tạo phiếu mới
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => "tab-btn" + (isActive ? " active" : "")}>
          Danh sách phiếu
        </NavLink>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreateNotePage />} />
        <Route path="/notes" element={<ListNotePage />} />
      </Routes>
    </div>
  );
}
