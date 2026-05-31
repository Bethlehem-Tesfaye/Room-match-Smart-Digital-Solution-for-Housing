import { Link } from "react-router-dom";
import Logo from "../../../components/logo";
import { palette } from "../../../theme/palette";

const linkColumns = {
  links: [
    { to: "/properties", label: "Browse properties" },
    { to: "/roommate", label: "Find roommate" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
  ],
  cities: [
    { to: "/properties", label: "Addis Ababa" },
    { to: "/properties", label: "Bole" },
    { to: "/properties", label: "Kazanchis" },
    { to: "/properties", label: "CMC" },
  ],
  contact: [
    { to: "mailto:support@roommatch.com", label: "support@roommatch.com" },
    { to: "/message", label: "Contact us" },
  ],
};

function LandingFooter() {
  return (
    <footer
      className="border-t px-4 py-12"
      style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="flex-row gap-2" />
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: palette.softPurple }}
          >
            Find your next home and roommate with confidence.
          </p>
        </div>

        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: palette.softPurple }}
          >
            Links
          </p>
          <nav className="mt-3 flex flex-col gap-2">
            {linkColumns.links.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm transition-colors hover:text-(--palette-purple)"
                style={{ color: "var(--app-text)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: palette.softPurple }}
          >
            Cities
          </p>
          <nav className="mt-3 flex flex-col gap-2">
            {linkColumns.cities.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm transition-colors hover:text-(--palette-purple)"
                style={{ color: "var(--app-text)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: palette.softPurple }}
          >
            Contact
          </p>
          <nav className="mt-3 flex flex-col gap-2">
            {linkColumns.contact.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="text-sm transition-colors hover:text-(--palette-purple)"
                style={{ color: "var(--app-text)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <p
        className="mx-auto mt-10 max-w-6xl text-center text-[11px] sm:text-left"
        style={{ color: palette.softPurple }}
      >
        &copy; {new Date().getFullYear()} RoomMatch. All rights reserved.
      </p>
    </footer>
  );
}

export default LandingFooter;
