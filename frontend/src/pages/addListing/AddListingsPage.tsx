import CreatePropertyForm from "../../features/addListing/components/CreatePropertyForm";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import { palette } from "../../theme/palette";

function AddListingsPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: palette.pageBg }}>
      <DashboardNavbar activeTab="add-listing" />
      <CreatePropertyForm />
    </main>
  );
}

export default AddListingsPage;
