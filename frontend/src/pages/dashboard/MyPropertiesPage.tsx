import DashboardFooter from "../../features/dashbord/componets/DashboardFooter";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import MyPropertyList from "../../features/dashbord/componets/MyPropertyList";
import { palette } from "../../theme/palette";
import { useNavigate } from "react-router-dom";
import type { DashboardTabKey } from "../../features/dashbord/types/types";

function MyPropertiesPage() {
  const navigate = useNavigate();

  const handleTabChange = (tab: DashboardTabKey) => {
    if (tab === "dashboard") {
      navigate("/dashboard");
      return;
    }

    if (tab === "my-properties") {
      navigate("/dashboard/my-properties");
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: palette.pageBg }}
    >
      <DashboardNavbar
        activeTab="my-properties"
        onTabChange={handleTabChange}
      />

      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1
              className="text-3xl font-extrabold"
              style={{ color: palette.deep }}
            >
              My Properties
            </h1>
            <p className="mt-2 text-sm" style={{ color: palette.purple }}>
              Browse and manage your own property listings.
            </p>
          </div>

          <MyPropertyList />
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}

export default MyPropertiesPage;
