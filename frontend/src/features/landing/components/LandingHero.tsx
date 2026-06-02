import { Link } from "react-router-dom";
import { palette } from "../../../theme/palette";

function LandingHero() {
  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden px-4 py-20 md:min-h-[85vh] md:py-24"
      style={{ backgroundColor: palette.pageBg }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-120 w-120 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{
          background: `radial-gradient(circle, ${palette.cardMutedBg} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-3xl text-center">
        <h1
          className="font-serif text-[2.5rem] font-bold leading-tight md:text-[4rem]"
          style={{ color: "var(--palette-deep)" }}
        >
          Find your perfect
          <br />
          <span style={{ color: palette.purple }}>place & roommate</span>
        </h1>

        <p
          className="mx-auto mt-5 max-w-120 text-sm leading-relaxed md:text-base"
          style={{ color: palette.softPurple }}
        >
          Discover rental properties and connect with compatible roommates. Your
          ideal living situation is just a few clicks away.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/properties"
            className="inline-flex min-h-11 min-w-35 items-center justify-center rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: palette.purple }}
          >
            Browse properties
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex min-h-11 min-w-35 items-center justify-center rounded-lg border px-6 py-2.5 text-sm font-bold transition-colors"
            style={{
              borderColor: palette.border,
              color: "var(--palette-deep)",
            }}
          >
            List Your Property
          </Link>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
