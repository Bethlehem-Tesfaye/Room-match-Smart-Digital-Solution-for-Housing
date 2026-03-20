import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Home,
} from "lucide-react";
import { palette } from "../../../theme/palette";
import { Link } from "react-router-dom";

function LandingAudienceCards() {
  return (
    <section className="px-4 py-16" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
        <article
          className="rounded-2xl border p-7"
          style={{ backgroundColor: "#F4F1FE", borderColor: "#E1D8FA" }}
        >
          <div
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: palette.softPurple, color: "#FFFFFF" }}
          >
            <Home size={20} />
          </div>
          <h3
            className="mt-5 text-3xl font-bold"
            style={{ color: palette.deep }}
          >
            Looking for a Place?
          </h3>
          <p className="mt-3 text-sm" style={{ color: palette.purple }}>
            Browse thousands of verified listings, find compatible roommates,
            and secure your dream rental with ease.
          </p>
          <ul
            className="mt-5 space-y-2 text-sm"
            style={{ color: palette.purple }}
          >
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Advanced search filters
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} /> AI roommate matching
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Direct messaging
            </li>
          </ul>
          <Link to="/properties">
            {" "}
            <button
              type="button"
              className="mt-6 cursor-pointer inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: palette.purple }}
            >
              Start Searching <ArrowRight size={16} />
            </button>{" "}
          </Link>
        </article>

        <article
          className="rounded-2xl border p-7"
          style={{ backgroundColor: "#F9F7FF", borderColor: "#E6DEFB" }}
        >
          <div
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: palette.lightPurple,
              color: palette.deep,
            }}
          >
            <BriefcaseBusiness size={20} />
          </div>
          <h3
            className="mt-5 text-3xl font-bold"
            style={{ color: palette.deep }}
          >
            Have a Property?
          </h3>
          <p className="mt-3 text-sm" style={{ color: palette.purple }}>
            List your property and connect with thousands of verified tenants
            looking for their next home.
          </p>
          <ul
            className="mt-5 space-y-2 text-sm"
            style={{ color: palette.purple }}
          >
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Free listing creation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Verified tenant inquiries
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Easy property management
            </li>
          </ul>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: palette.lightPurple,
              color: palette.deep,
            }}
          >
            List Your Property <ArrowRight size={16} />
          </button>
        </article>
      </div>
    </section>
  );
}

export default LandingAudienceCards;
