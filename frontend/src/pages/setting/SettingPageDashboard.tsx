import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";
import SettingsPanel from "../../features/setting/components/SettingsPanel";
import { palette } from "../../theme/palette";

function SettingPageDashboard() {
  return (
    <main className="flex min-h-screen flex-col">
      <DashboardNavbar activeTab={null} />
      <section
        className="flex-1 px-4 py-10 pt-24"
        style={{ backgroundColor: palette.pageBg }}
      >
        <div className="mx-auto max-w-6xl">
          <SettingsPanel />
        </div>
      </section>
    </main>
  );
}

export default SettingPageDashboard;
