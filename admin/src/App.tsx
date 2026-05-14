import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
