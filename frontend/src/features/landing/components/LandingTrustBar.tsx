import { palette } from "../../../theme/palette";

const stats = [
  { value: "2,400+", label: "listings" },
  { value: "1,800+", label: "verified landlords" },
  { value: "4.8★", label: "average rating" },
  { value: "12", label: "cities" },
];

function LandingTrustBar() {
  return (
    <section
      className="border-y px-4 py-5"
      style={{
        backgroundColor: "var(--palette-card-bg)",
        borderColor: palette.border,
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-y-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center">
            {index > 0 ? (
              <span
                className="mx-6 hidden h-8 w-px sm:block"
                style={{ backgroundColor: palette.border }}
                aria-hidden="true"
              />
            ) : null}
            <div className="px-6 text-center sm:px-0">
              <p
                className="text-sm font-bold"
                style={{ color: "var(--palette-deep)" }}
              >
                {stat.value}
              </p>
              <p
                className="mt-0.5 text-[11px]"
                style={{ color: palette.softPurple }}
              >
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LandingTrustBar;
