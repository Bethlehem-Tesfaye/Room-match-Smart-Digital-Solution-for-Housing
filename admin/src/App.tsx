import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminSignupPage from "./pages/AdminSignupPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin/setup-root" element={<AdminSignupPage />} />
      </Routes>
    </Router>
  );
}

export default App;
