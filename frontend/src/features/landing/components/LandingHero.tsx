import { Search } from "lucide-react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { palette } from "../../../theme/palette";

interface LandingHeroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
}

function LandingHero({
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: LandingHeroProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit();
  };

  return (
    <section
      className="relative flex min-h-[100vh] items-center overflow-hidden px-4 py-20 md:min-h-[85vh] md:py-24"
      style={{ backgroundColor: palette.pageBg }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
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
          className="mx-auto mt-5 max-w-[480px] text-sm leading-relaxed md:text-base"
          style={{ color: palette.softPurple }}
        >
          Discover rental properties and connect with compatible roommates. Your
          ideal living situation is just a few clicks away.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/properties"
            className="inline-flex min-h-11 min-w-[140px] items-center justify-center rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: palette.purple }}
          >
            Browse properties
          </Link>
          <Link
            to="/roommate"
            className="inline-flex min-h-11 min-w-[140px] items-center justify-center rounded-lg border px-6 py-2.5 text-sm font-bold transition-colors"
            style={{
              borderColor: palette.border,
              color: "var(--palette-deep)",
            }}
          >
            Find a roommate
          </Link>
        </div>

        <form
          className="mx-auto mt-10 flex w-full max-w-2xl flex-col items-stretch gap-2 rounded-full border p-2 sm:flex-row sm:items-center"
          style={{
            backgroundColor: palette.cardBg,
            borderColor: palette.border,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            placeholder="Enter city, neighborhood, or zip code..."
            className="h-11 min-h-[44px] flex-1 rounded-full border-0 bg-transparent px-4 text-sm outline-none"
            style={{ color: "var(--app-text)" }}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <button
            type="submit"
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: palette.purple }}
          >
            <Search size={16} />
            Search
          </button>
        </form>
      </div>
    </section>
  );
}

export default LandingHero;
