import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ProtectedLayout from "../lib/ProtectedLayout";
import VerifyNoticePage from "../features/auth/components/VerifyNoticePage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import NotFound from "../components/NotFound";
import LandingPage from "../pages/landing/LandingPage";
import PropertiesPage from "../pages/properties/PropertiesPage";
import PropertyDetailsPage from "../pages/properties/PropertyDetailsPage";
import SavedPropertiesPage from "../pages/properties/SavedPropertiesPage";
import CreatePropertyPage from "../pages/createProperty/CreatePropertyPage";
import MessagePage from "../pages/message/MessagePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/properties",
    element: <PropertiesPage />,
  },
  {
    path: "/properties/:id",
    element: <PropertyDetailsPage />,
  },
  {
    path: "/verify-notice",
    element: <VerifyNoticePage />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
  // protected routes
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/properties/create",
        element: <CreatePropertyPage />,
      },
      {
        path: "/properties/saved",
        element: <SavedPropertiesPage />,
      },
      {
        path: "/message",
        element: <MessagePage />,
      },
    ],
  },
]);
