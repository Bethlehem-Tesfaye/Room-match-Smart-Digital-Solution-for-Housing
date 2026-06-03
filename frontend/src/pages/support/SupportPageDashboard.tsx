import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import SupportPanel from "../../features/support/components/SupportPanel";

function SupportPageDashboard() {
  return (
    <main
      className="flex min-h-screen flex-col pt-14"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <DashboardNavbar activeTab={null} />
      <section className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <SupportPanel />
        </div>
      </section>
    </main>
  );
}

export default SupportPageDashboard;
