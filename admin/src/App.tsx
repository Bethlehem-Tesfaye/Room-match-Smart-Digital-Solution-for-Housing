import { Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ReportsPage from "./pages/ReportsPage";
import PropertiesPage from "./pages/PropertiesPage";
import { AdminNotificationProvider } from "./context/AdminNotificationContext";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<AdminNotificationProvider />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/properties" element={<PropertiesPage />} />
        <Route path="/dashboard/reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
