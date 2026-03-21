import { useParams } from "react-router-dom";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import EditListingForm from "../../features/editListing/components/EditListingForm";
import { palette } from "../../theme/palette";

function EditListingPage() {
  const { id } = useParams();

  return (
    <main className="min-h-screen" style={{ backgroundColor: palette.pageBg }}>
      <DashboardNavbar activeTab="my-properties" />
      {id ? (
        <EditListingForm propertyId={id} />
      ) : (
        <section className="mx-auto max-w-4xl px-4 py-12">
          <div
            className="rounded-2xl border p-6 text-sm"
            style={{ borderColor: palette.border, color: palette.purple }}
          >
            Invalid listing id.
          </div>
        </section>
      )}
    </main>
  );
}

export default EditListingPage;
