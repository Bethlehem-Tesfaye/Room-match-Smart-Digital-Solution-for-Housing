import { Link } from "react-router-dom";
import { palette } from "../../../theme/palette";

function LandingRoommateCallout() {
  return (
    <section
      className="px-4 py-16 md:py-20"
      style={{ backgroundColor: palette.cardMutedBg }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <div>
          <h2
            className="font-serif text-3xl font-bold leading-tight md:text-4xl"
            style={{ color: "var(--palette-deep)" }}
          >
            Find a roommate who fits your lifestyle
          </h2>
          <p
            className="mt-4 max-w-md text-sm leading-relaxed md:text-base"
            style={{ color: palette.softPurple }}
          >
            Answer a few questions about your habits and preferences. We&apos;ll
            match you with compatible roommates in your area.
          </p>
          <Link
            to="/roommate"
            className="mt-8 inline-flex min-h-11 items-center rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: palette.purple }}
          >
            Explore roommate matching
          </Link>
        </div>

        <div
          className="relative mx-auto h-64 w-full max-w-sm md:mx-0 md:h-72"
          aria-hidden="true"
        >
          <div
            className="absolute left-4 top-6 h-40 w-48 rounded-xl"
            style={{ backgroundColor: palette.cardMutedAltBg }}
          />
          <div
            className="absolute right-2 top-16 h-36 w-44 rounded-xl"
            style={{ backgroundColor: palette.chipBg }}
          />
          <div
            className="absolute bottom-4 left-12 h-32 w-52 rounded-xl border"
            style={{
              backgroundColor: palette.cardBg,
              borderColor: palette.border,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default LandingRoommateCallout;
