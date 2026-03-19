import { Link } from "react-router-dom";
import { palette } from "../../../theme/palette";

function LandingFooter() {
  return (
    <footer
      className="border-t px-4 py-8"
      style={{ borderColor: "#E7E1FA", backgroundColor: palette.deep }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <div>
          <p
            className="text-lg font-bold"
            style={{ color: palette.lightPurple }}
          >
            Room-Match
          </p>
          <p className="text-sm" style={{ color: palette.lightPurple }}>
            Find your next home and roommate with confidence.
          </p>
        </div>

        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link to="/" style={{ color: palette.lightPurple }}>
            Home
          </Link>
          <Link to="/login" style={{ color: palette.lightPurple }}>
            Browse property
          </Link>
          <Link to="/register" style={{ color: palette.lightPurple }}>
            Find Roommate
          </Link>
          <Link to="/register" style={{ color: palette.lightPurple }}>
            Login
          </Link>
          <Link to="/register" style={{ color: palette.lightPurple }}>
            Register
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default LandingFooter;
