import { palette } from "../../../theme/palette";

function DashboardFooter() {
  return (
    <footer
      className="mt-16 border-t px-4 py-8"
      style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <p className="text-sm" style={{ color: palette.softPurple }}>
          Room-Match Owner Portal
        </p>
        <p className="text-sm font-semibold" style={{ color: palette.purple }}>
          Manage your listings in one place
        </p>
      </div>
    </footer>
  );
}

export default DashboardFooter;
