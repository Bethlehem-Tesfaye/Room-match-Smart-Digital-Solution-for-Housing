import { Search } from "lucide-react";

const palette = {
  deep: "#363B4E",
  purple: "#4F3B78",
  softPurple: "#927FBF",
  lightPurple: "#C4BBF0",
};

function LandingHero() {
  return (
    <section
      className="relative overflow-hidden px-4 py-18 md:py-24"
      style={{
        background: `linear-gradient(135deg, ${palette.deep} 0%, ${palette.purple} 55%, ${palette.softPurple} 100%)`,
      }}
    >
      <div className="mx-auto max-w-5xl text-center text-white">
        <span
          className="inline-block rounded-full px-4 py-1 text-xs font-semibold"
          style={{ backgroundColor: "rgba(196, 187, 240, 0.2)", color: "#FFFFFF" }}
        >
          The smarter way to find your next home
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
          Find Your Perfect
          <br />
          <span style={{ color: palette.lightPurple }}>Place & Roommate</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm text-white/85 md:text-base">
          Discover rental properties and connect with compatible roommates.
          Your ideal living situation is just a few clicks away.
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-2xl items-center gap-2 rounded-2xl bg-white/15 p-2 backdrop-blur-md">
          <input
            type="text"
            placeholder="Enter city, neighborhood, or zip code..."
            className="h-11 flex-1 rounded-xl border-0 bg-white px-4 text-sm text-slate-800 outline-none"
          />
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: palette.purple }}
          >
            <Search size={16} />
            Search
          </button>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
