import DashboardFooter from "../../features/dashbord/componets/DashboardFooter";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import MyPropertyList from "../../features/dashbord/componets/MyPropertyList";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { palette } from "../../theme/palette";

function MyPropertiesPage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: palette.pageBg }}
    >
      <DashboardNavbar activeTab="my-properties" />

      <main className="flex-1 px-4 py-10 pt-24">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-start justify-between">
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

            <Link
              to="/properties/create"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
              style={{ backgroundColor: palette.purple, color: palette.pageBg }}
            >
              <Plus size={16} />
              Add Property
            </Link>
          </div>

          <MyPropertyList />
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}

export default MyPropertiesPage;
