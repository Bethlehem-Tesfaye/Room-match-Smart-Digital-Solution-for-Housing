import type { Property } from "../../property/types/type";
import { palette } from "../../../theme/palette";
import FeaturedPropertyCard from "./FeaturedPropertyCard";

interface LandingFeaturedPropertiesProps {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
}

function LandingFeaturedProperties({
  properties,
  isLoading,
  isError,
}: LandingFeaturedPropertiesProps) {
  return (
    <section className="px-4 py-16" style={{ backgroundColor: "#F7F5FF" }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              className="text-3xl font-extrabold"
              style={{ color: palette.deep }}
            >
              Featured Properties
            </h2>
            <p className="mt-2 text-sm" style={{ color: palette.purple }}>
              Discover top-rated rentals in your area
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: "#C4BBF0", color: palette.purple }}
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-72 animate-pulse rounded-2xl"
                style={{ backgroundColor: "#EDE8FD" }}
              />
            ))}
          </div>
        ) : isError ? (
          <div
            className="mt-8 rounded-2xl border p-6 text-sm"
            style={{ borderColor: "#E1D8FA", color: palette.purple }}
          >
            Couldn&apos;t load featured properties right now.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((property) => (
              <FeaturedPropertyCard key={property._id} property={property} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LandingFeaturedProperties;
