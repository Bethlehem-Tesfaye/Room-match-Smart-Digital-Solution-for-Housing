import DashboardFooter from "../../features/dashbord/componets/DashboardFooter";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import MyPropertyList from "../../features/dashbord/componets/MyPropertyList";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

function MyPropertiesPage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <DashboardNavbar activeTab="my-properties" />

      <main className="flex-1 px-4 py-10 pt-20">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Page header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="mb-1 font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--palette-soft-purple)" }}
              >
                Owner · Listings
              </p>
              <h1
                className="text-2xl font-semibold"
                style={{ color: "var(--palette-deep)" }}
              >
                My properties
              </h1>
              <p
                className="mt-0.5 text-sm"
                style={{ color: "var(--palette-soft-purple)" }}
              >
                Browse and manage your property listings.
              </p>
            </div>

            <Link
              to="/properties/create"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#8b64c8" }}
            >
              <Plus size={14} />
              Add property
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
