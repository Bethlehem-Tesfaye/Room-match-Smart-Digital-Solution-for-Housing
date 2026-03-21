import { MessageCircle, Search, ShieldCheck, Users } from "lucide-react";
import { palette } from "../../../theme/palette";
import { motion } from "framer-motion";

const features = [
  {
    title: "Smart Search",
    description:
      "Find your perfect place with powerful filters for price, location, and amenities.",
    icon: Search,
  },
  {
    title: "Roommate Matching",
    description:
      "Our AI matches you with compatible roommates based on lifestyle and preferences.",
    icon: Users,
  },
  {
    title: "Verified Listings",
    description:
      "Properties and users are verified for your safety and peace of mind.",
    icon: ShieldCheck,
  },
  {
    title: "Direct Chat",
    description:
      "Connect directly with landlords or potential roommates instantly.",
    icon: MessageCircle,
  },
];

function LandingWhyChoose() {
  return (
    <section
      className="px-4 py-16 md:py-20"
      style={{ backgroundColor: palette.sectionBg }}
    >
      <motion.div
        className="mx-auto max-w-6xl"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="text-center">
          <h2
            className="text-3xl font-extrabold"
            style={{ color: palette.deep }}
          >
            Why Choose RoomMatch?
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-sm"
            style={{ color: palette.purple }}
          >
            We&apos;ve reimagined the rental experience to make finding your
            next home simple, safe, and enjoyable.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                className="rounded-2xl border p-5 shadow-sm"
                style={{
                  backgroundColor: palette.cardBg,
                  borderColor: palette.border,
                }}
              >
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: palette.lightPurple,
                    color: palette.purple,
                  }}
                >
                  <Icon size={20} />
                </div>
                <h3
                  className="mt-4 text-lg font-bold"
                  style={{ color: palette.deep }}
                >
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: palette.purple }}>
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

export default LandingWhyChoose;
