import CreatePropertyForm from "../../features/addListing/components/CreatePropertyForm";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import { palette } from "../../theme/palette";

function AddListingsPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: palette.pageBg }}>
      <DashboardNavbar activeTab="add-listing" />
      <section className="flex-1 px-4 py-10 pt-16">
        <CreatePropertyForm />
      </section>
    </main>
  );
}

export default AddListingsPage;
