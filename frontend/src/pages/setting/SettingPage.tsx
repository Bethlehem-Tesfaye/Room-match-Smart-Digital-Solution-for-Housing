import LandingNavbar from "../../features/landing/components/LandingNavbar";
import SettingsPanel from "../../features/setting/components/SettingsPanel";
import { palette } from "../../theme/palette";

function SettingPage() {
  return (
    <main className="pt-24">
      <LandingNavbar />

      <section
        className="-mt-6 px-4 py-12"
        style={{ backgroundColor: palette.pageBg }}
      >
        <div className="mx-auto max-w-6xl">
          <SettingsPanel />
        </div>
      </section>
    </main>
  );
}

export default SettingPage;
