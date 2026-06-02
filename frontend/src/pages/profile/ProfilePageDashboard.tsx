import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import UpdateProfileForm from "../../features/profile/components/UpdateProfileForm";
import { palette } from "../../theme/palette";

function ProfilePageDashboard() {
  return (
    <main className="flex min-h-screen flex-col">
      <DashboardNavbar activeTab={null} />

      <section
        className="flex-1 px-4 py-10 pt-24"
        style={{ backgroundColor: palette.pageBg }}
      >
        <div className="mx-auto max-w-6xl">
          <UpdateProfileForm />
        </div>
      </section>
    </main>
  );
}

export default ProfilePageDashboard;
