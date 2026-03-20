import LandingNavbar from "../../features/landing/components/LandingNavbar";
import UpdateProfileForm from "../../features/profile/components/UpdateProfileForm";
import { palette } from "../../theme/palette";

function ProfilePage() {
  return (
    <main className="pt-24">
      <LandingNavbar />

      <section
        className="-mt-6 px-4 py-12"
        style={{ backgroundColor: palette.pageBg }}
      >
        <div className="mx-auto max-w-6xl">
          <UpdateProfileForm />
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
