import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardFooter from "./DashboardFooter";
import DashboardNavbar from "./DashboardNavbar";
import DashboardTabs from "./DashboardTabs";
import { palette } from "../../../theme/palette";
import type { DashboardTabKey } from "../types/types";

function DashboardShell() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTabKey>("dashboard");

  const handleTabChange = (tab: DashboardTabKey) => {
    if (tab === "my-properties") {
      navigate("/dashboard/my-properties");
      return;
    }

    setActiveTab(tab);
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: palette.pageBg }}
    >
      <DashboardNavbar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 px-4 py-10 pt-24">
        <div className="mx-auto max-w-6xl">
          <DashboardTabs activeTab={activeTab} />
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}

export default DashboardShell;
