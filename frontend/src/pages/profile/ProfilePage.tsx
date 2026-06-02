import LandingNavbar from "../../features/landing/components/LandingNavbar";
import UpdateProfileForm from "../../features/profile/components/UpdateProfileForm";

function ProfilePage() {
  return (
    <main
      className="min-h-screen pt-14"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <LandingNavbar />
      <section className="px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <UpdateProfileForm />
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
