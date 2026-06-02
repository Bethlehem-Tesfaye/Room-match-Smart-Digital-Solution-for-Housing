import { palette } from "../../../theme/palette";

function DashboardFooter() {
  return (
    <footer
      className="border-t px-6 py-5"
      style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <p
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: palette.softPurple }}
        >
          Room-Match · Owner Portal
        </p>
        <p
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: palette.lightPurple }}
        >
          Manage listings in one place
        </p>
      </div>
    </footer>
  );
}

export default DashboardFooter;
