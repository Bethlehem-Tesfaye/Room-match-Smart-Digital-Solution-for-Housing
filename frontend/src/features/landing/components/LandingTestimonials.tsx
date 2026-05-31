import { Star } from "lucide-react";
import { palette } from "../../../theme/palette";

const testimonials = [
  {
    quote:
      "Found my apartment in Bole within a week. The filters made it easy to narrow down exactly what I needed.",
    name: "Hanna T.",
    role: "Tenant · Bole, Addis Ababa",
    rating: 5,
  },
  {
    quote:
      "RoomMatch connected me with a roommate who shares my schedule and budget. Moving in was seamless.",
    name: "Daniel M.",
    role: "Tenant · Kazanchis, Addis Ababa",
    rating: 5,
  },
  {
    quote:
      "As a landlord, I get serious inquiries from verified tenants. Listing took less than ten minutes.",
    name: "Selam A.",
    role: "Landlord · CMC, Addis Ababa",
    rating: 5,
  },
];

function LandingTestimonials() {
  return (
    <section className="px-4 py-16" style={{ backgroundColor: palette.pageBg }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h2
            className="font-serif text-3xl font-bold"
            style={{ color: "var(--palette-deep)" }}
          >
            What people are saying
          </h2>
          <p
            className="mt-2 max-w-lg text-sm leading-relaxed"
            style={{ color: palette.softPurple }}
          >
            Real stories from tenants and landlords across the city
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-xl border p-6"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.border,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={palette.purple}
                    style={{ color: palette.purple }}
                  />
                ))}
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--app-text)" }}
              >
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-5">
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--palette-deep)" }}
                >
                  {item.name}
                </p>
                <p
                  className="mt-0.5 text-[11px]"
                  style={{ color: palette.softPurple }}
                >
                  {item.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LandingTestimonials;
