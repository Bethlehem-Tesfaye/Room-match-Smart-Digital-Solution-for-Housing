import { Heart, MapPin } from "lucide-react";
import type { Property } from "../../property/types/type";

const palette = {
  deep: "#363B4E",
  purple: "#4F3B78",
  softPurple: "#927FBF",
};

interface FeaturedPropertyCardProps {
  property: Property;
}

const formatCurrency = (price: number, currency: string) => {
  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });

  return `${currency} ${numberFormatter.format(price)}`;
};

function FeaturedPropertyCard({ property }: FeaturedPropertyCardProps) {
  const primaryImage =
    property.images.find((image) => image.isPrimary) ?? property.images[0];

  return (
    <article
      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: "#E7E1FA" }}
    >
      <div
        className="relative h-44 w-full overflow-hidden"
        style={{ backgroundColor: "#F2EEFD" }}
      >
        {primaryImage ? (
          <img
            src={primaryImage.imageUrl}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: palette.softPurple }}
          >
            No image
          </div>
        )}
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90"
          aria-label="Save property"
        >
          <Heart size={15} style={{ color: palette.purple }} />
        </button>
      </div>

      <div className="p-4">
        <h3
          className="line-clamp-1 text-base font-bold"
          style={{ color: palette.deep }}
        >
          {property.title}
        </h3>

        <p
          className="mt-1 flex items-center gap-1 text-sm"
          style={{ color: palette.purple }}
        >
          <MapPin size={14} />
          {property.city}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <p
            className="text-2xl font-extrabold"
            style={{ color: palette.purple }}
          >
            {formatCurrency(property.price, property.currency)}
          </p>
          <p className="text-xs" style={{ color: palette.softPurple }}>
            {property.numberOfBedrooms} bd | {property.numberOfBathrooms} ba
          </p>
        </div>
      </div>
    </article>
  );
}

export default FeaturedPropertyCard;
