import LandingNavbar from "../../features/landing/components/LandingNavbar";
import SupportPanel from "../../features/support/components/SupportPanel";

function SupportPage() {
  return (
    <main
      className="min-h-screen pt-14"
      style={{ backgroundColor: "var(--palette-page-bg)" }}
    >
      <LandingNavbar />
      <section className="px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <SupportPanel />
        </div>
      </section>
    </main>
  );
}

export default SupportPage;
