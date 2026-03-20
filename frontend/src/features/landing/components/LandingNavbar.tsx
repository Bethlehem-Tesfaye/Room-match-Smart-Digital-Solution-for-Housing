import {
  Building2,
  Heart,
  LogIn,
  MessageCircle,
  PlusSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../../../components/logo";
import { palette } from "../../../theme/palette";

function LandingNavbar() {
  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 border-b bg-white/95 px-4 backdrop-blur"
      style={{ borderColor: "#E7E1FA" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 py-4">
        <Link to="/" aria-label="Go to home">
          <Logo className="flex-row gap-2" />
        </Link>

        <nav className="ml-auto flex items-center gap-2">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 rounded-lg cursor-pointer px-3 py-2 text-md font-semibold transition-colors"
            style={{
              color: palette.deep,
              borderColor: "#E7E1FA",
              backgroundColor: "#FFFFFF",
            }}
          >
            <Building2 size={16} style={{ color: palette.softPurple }} />
            Browse Property
          </Link>
          <Link
            to="/properties/saved"
            className="inline-flex items-center gap-2 rounded-lg cursor-pointer px-3 py-2 text-md font-semibold transition-colors"
            style={{
              color: palette.deep,
              borderColor: "#E7E1FA",
              backgroundColor: "#FFFFFF",
            }}
          >
            <Heart size={16} style={{ color: palette.softPurple }} />
            Saved Property
          </Link>
          <Link to="/message">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg cursor-pointer px-3 py-2 text-md font-semibold transition-colors"
              style={{
                color: palette.deep,
                borderColor: "#E7E1FA",
                backgroundColor: "#FFFFFF",
              }}
            >
              <MessageCircle size={16} style={{ color: palette.softPurple }} />
              Message
            </button>
          </Link>
          <Link to="/properties/create">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg cursor-pointer px-3 py-2 text-md font-semibold transition-colors"
              style={{
                color: palette.deep,
                borderColor: "#E7E1FA",
                backgroundColor: "#FFFFFF",
              }}
            >
              <PlusSquare size={16} style={{ color: palette.softPurple }} />
              Add Property
            </button>
          </Link>

          <Link
            to="/login"
            className="ml-3 inline-flex items-center gap-2 rounded-lg cursor-pointer px-4 py-2 text-md font-semibold"
            style={{
              borderColor: palette.lightPurple,
              color: palette.purple,
              backgroundColor: "#FFFFFF",
            }}
          >
            <LogIn size={16} />
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default LandingNavbar;
