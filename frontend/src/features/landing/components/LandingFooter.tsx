import { Link } from "react-router-dom";
import { palette } from "../../../theme/palette";

function LandingFooter() {
  return (
    <footer
      className="border-t px-4 py-8"
      style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <div>
          <p className="text-lg font-bold" style={{ color: palette.purple }}>
            Room-Match
          </p>
          <p className="text-sm" style={{ color: palette.purple }}>
            Find your next home and roommate with confidence.
          </p>
        </div>

        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link to="/" style={{ color: palette.purple }}>
            Home
          </Link>
          <Link to="/login" style={{ color: palette.purple }}>
            Browse property
          </Link>
          <Link to="/register" style={{ color: palette.purple }}>
            Find Roommate
          </Link>
          <Link to="/register" style={{ color: palette.purple }}>
            Login
          </Link>
          <Link to="/register" style={{ color: palette.purple }}>
            Register
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default LandingFooter;
