import CreatePropertyForm from "../../features/addListing/components/CreatePropertyForm";
import { palette } from "../../theme/palette";

function AddListingsPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: palette.pageBg }}>
      <CreatePropertyForm />
    </main>
  );
}

export default AddListingsPage;
