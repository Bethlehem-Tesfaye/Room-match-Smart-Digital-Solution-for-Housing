import CreatePropertyForm from "../../features/addListing/components/CreatePropertyForm";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";

function AddListingsPage() {
  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <DashboardNavbar activeTab="add-listing" />
      <section className="flex-1 px-4 pt-20">
        <CreatePropertyForm />
      </section>
    </main>
  );
}

export default AddListingsPage;
