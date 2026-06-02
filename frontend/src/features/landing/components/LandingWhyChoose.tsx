import { palette } from "../../../theme/palette";

const steps = [
  {
    number: "1",
    title: "Search & filter",
    description:
      "Browse listings by location, price, and amenities to find places that match your needs.",
  },
  {
    number: "2",
    title: "Connect with landlords",
    description:
      "Message property owners directly, ask questions, and schedule viewings in-app.",
  },
  {
    number: "3",
    title: "Move in with confidence",
    description:
      "Secure your rental and optionally find a compatible roommate before you move.",
  },
];

function LandingWhyChoose() {
  return (
    <section
      className="px-4 py-16 md:py-20"
      style={{ backgroundColor: palette.sectionBg }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h2
            className="font-serif text-3xl font-bold"
            style={{ color: "var(--palette-deep)" }}
          >
            How it works
          </h2>
          <p
            className="mt-2 max-w-lg text-sm leading-relaxed"
            style={{ color: palette.softPurple }}
          >
            Three simple steps from search to move-in
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number}>
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                style={{
                  backgroundColor: palette.chipBg,
                  color: palette.purple,
                }}
              >
                {step.number}
              </div>
              <h3
                className="mt-5 text-lg font-bold"
                style={{ color: "var(--palette-deep)" }}
              >
                {step.title}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: palette.softPurple }}
              >
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LandingWhyChoose;
