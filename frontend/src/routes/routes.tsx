import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import MyPropertiesPage from "../pages/dashboard/MyPropertiesPage";
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
import MessagePage from "../pages/message/MessagePage";
import ProfilePage from "../pages/profile/ProfilePage";
import SettingPage from "../pages/setting/SettingPage";
import AddListingsPage from "../pages/addListing/AddListingsPage";
import EditListingPage from "../pages/editListing/EditListingPage";
import PropertyPreviewPage from "../pages/properties/PropertyPreviewPage";
import ProfilePageDashboard from "../pages/profile/ProfilePageDashboard";
import SettingPageDashboard from "../pages/setting/SettingPageDashboard";
import RoommatePage from "../pages/roommate/RoommatePage";
import MessagePageDashboard from "../pages/message/MessagePageDashboard";
import RentalRequestsPage from "../pages/dashboard/RentalRequestsPage";
import MyRentalsPage from "../pages/rentals/MyRentalsPage";

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
        path: "dashboard/my-properties",
        element: <MyPropertiesPage />,
      },
      {
        path: "/properties/create",
        element: <AddListingsPage />,
      },
      {
        path: "/properties/:id/edit",
        element: <EditListingPage />,
      },
      {
        path: "/properties/saved",
        element: <SavedPropertiesPage />,
      },
      {
        path: "/message",
        element: <MessagePage />,
      },
      {
        path: "/my-rentals",
        element: <MyRentalsPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/dashboard/profile",
        element: <ProfilePageDashboard />,
      },
      {
        path: "/setting",
        element: <SettingPage />,
      },
      {
        path: "/dashboard/setting",
        element: <SettingPageDashboard />,
      },
      {
        path: "/properties/preview/:id",
        element: <PropertyPreviewPage />,
      },
      {
        path: "roommate",
        element: <RoommatePage />,
      },
      {
        path: "/message",
        element: <MessagePage />,
      },
      {
        path: "/dashboard/message",
        element: <MessagePageDashboard />,
      },
      {
        path: "/dashboard/rental-requests",
        element: <RentalRequestsPage />,
      },
    ],
  },
]);
