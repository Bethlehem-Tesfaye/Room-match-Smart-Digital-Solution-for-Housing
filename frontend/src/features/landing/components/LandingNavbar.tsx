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
    <header className="border-b px-4" style={{ borderColor: "#E7E1FA" }}>
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
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg cursor-pointer px-3 py-2 text-md font-semibold transition-colors"
            style={{
              color: palette.deep,
              borderColor: "#E7E1FA",
              backgroundColor: "#FFFFFF",
            }}
          >
            <Heart size={16} style={{ color: palette.softPurple }} />
            Saved Property
          </button>
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
