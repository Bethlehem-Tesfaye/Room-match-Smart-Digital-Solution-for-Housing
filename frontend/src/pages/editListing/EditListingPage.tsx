import { useParams } from "react-router-dom";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import EditListingForm from "../../features/editListing/components/EditListingForm";

function EditListingPage() {
  const { id } = useParams();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <DashboardNavbar activeTab="my-properties" />
      {id ? (
        <EditListingForm propertyId={id} />
      ) : (
        <section className="mx-auto max-w-4xl px-4 py-12 pt-20">
          <div
            className="rounded-2xl border px-6 py-10 text-center text-sm"
            style={{
              borderColor: "var(--palette-border)",
              backgroundColor: "var(--palette-card-bg)",
              color: "var(--palette-soft-purple)",
            }}
          >
            Invalid listing ID.
          </div>
        </section>
      )}
    </main>
  );
}

export default EditListingPage;
