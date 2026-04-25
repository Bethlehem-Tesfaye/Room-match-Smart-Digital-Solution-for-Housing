import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import { useSendPropertyMessage } from "../../features/message/hooks/useMessageHooks";
import FavoriteAuthModal from "../../features/property/components/FavoriteAuthModal";
import PropertyDetailsView from "../../features/property/components/PropertyDetailsView";
import {
  useBrowserPropertyDetails,
  useRemoveFavorite,
  useSaveFavorite,
} from "../../features/property/hooks/usePropertyHooks";
import type { Property } from "../../features/property/types/type";
import { palette } from "../../theme/palette";

function PropertyDetailsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="skeleton h-72 rounded-2xl sm:col-span-2" />
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="skeleton h-22 rounded-xl" />
            ))}
          </div>
        </div>

        <div
          className="skeleton h-72 rounded-2xl border"
          style={{ borderColor: palette.border }}
        />

        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="skeleton h-40 rounded-2xl border"
            style={{ borderColor: palette.border }}
          />
        ))}
      </div>

      <aside>
        <div
          className="skeleton h-64 rounded-2xl border"
          style={{ borderColor: palette.border }}
        />
      </aside>
    </div>
  );
}

function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data: property, isLoading, isError } = useBrowserPropertyDetails(id);
  const { isPending, isAuthenticated, user } = useCurrentUser();
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();
  const sendPropertyMessage = useSendPropertyMessage();

  const handleToggleFavorite = async (targetProperty: Property) => {
    if (isPending) return;

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsFavoriteLoading(true);

    try {
      if (targetProperty.isSaved) {
        await removeFavorite.mutateAsync({ propertyId: targetProperty._id });
      } else {
        await saveFavorite.mutateAsync({ propertyId: targetProperty._id });
      }
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleSendMessage = async ({ content }: { content: string }) => {
    if (!property) return;

    if (isPending) return;

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const ownerId = property.owner?._id || property.ownerId;

    if (!ownerId) {
      toast.error("Property owner not found");
      return;
    }

    if (user?.id === ownerId) {
      toast.error("You cannot message yourself");
      return;
    }

    try {
      const result = await sendPropertyMessage.mutateAsync({
        ownerId,
        listingId: property._id,
        content,
      });

      navigate(`/message?conversationId=${result.conversationId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
    }
  };

  return (
    <main className="pt-24">
      <LandingNavbar />

      <section
        className="px-4 py-8"
        style={{ backgroundColor: palette.sectionBg }}
      >
        <div className="mx-auto max-w-6xl">
          <Link
            to="/properties"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: palette.deep }}
          >
            <ArrowLeft size={16} />
            Back to Listings
          </Link>

          {isLoading ? (
            <PropertyDetailsSkeleton />
          ) : isError || !property ? (
            <div
              className="rounded-2xl border p-6 text-sm"
              style={{ borderColor: "#E1D8FA", color: palette.purple }}
            >
              Couldn&apos;t load property details.
            </div>
          ) : (
            <PropertyDetailsView
              property={property}
              onToggleFavorite={handleToggleFavorite}
              isFavoriteLoading={isFavoriteLoading}
              onSendMessage={handleSendMessage}
              isSendMessageLoading={sendPropertyMessage.isPending}
            />
          )}
        </div>
      </section>

      <FavoriteAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}

export default PropertyDetailsPage;
