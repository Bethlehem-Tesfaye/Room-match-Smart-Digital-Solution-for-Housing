import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import { useSendPropertyMessage } from "../../features/message/hooks/useMessageHooks";
import FavoriteAuthModal from "../../features/property/components/FavoriteAuthModal";
import PropertyDetailsView, {
  PropertyDetailsSkeleton,
} from "../../features/property/components/PropertyDetailsView";
import {
  useBrowserPropertyDetails,
  useRemoveFavorite,
  useSaveFavorite,
} from "../../features/property/hooks/usePropertyHooks";
import type { Property } from "../../features/property/types/type";
import { palette } from "../../theme/palette";

function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const {
    data: property,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useBrowserPropertyDetails(id);
  const { isPending, isAuthenticated, user } = useCurrentUser();
  const saveFavorite = useSaveFavorite();
  const removeFavorite = useRemoveFavorite();
  const sendPropertyMessage = useSendPropertyMessage();

  const handleToggleFavorite = async (targetProperty: Property) => {
    if (isPending) return;

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      });
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

    if (property.status !== "Active") {
      toast.error("This property is no longer available.");
      return;
    }

    if (isPending) return;

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      });
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
    <main
      className="min-h-screen pb-8"
      style={{ backgroundColor: palette.pageBg }}
    >
      <LandingNavbar />

      <section className="px-4 py-8 pt-24">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/properties"
            className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold md:hidden"
            style={{ color: "var(--palette-deep)" }}
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          {isLoading ? (
            <PropertyDetailsSkeleton />
          ) : isError ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
              <RefreshCw
                size={64}
                className="mb-5"
                style={{ color: palette.softPurple }}
              />
              <p
                className="text-xl font-bold"
                style={{ color: "var(--palette-deep)" }}
              >
                Couldn&apos;t load this listing
              </p>
              <p
                className="mt-2 max-w-md text-sm leading-relaxed"
                style={{ color: palette.softPurple }}
              >
                Something went wrong while fetching this property. Please try
                again.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="mt-6 min-h-11 rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: palette.purple }}
              >
                {isFetching ? "Retrying..." : "Try again"}
              </button>
            </div>
          ) : !property ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
              <Home
                size={64}
                className="mb-5"
                style={{ color: palette.softPurple }}
              />
              <p
                className="text-xl font-bold"
                style={{ color: "var(--palette-deep)" }}
              >
                This listing isn&apos;t available
              </p>
              <p
                className="mt-2 max-w-md text-sm leading-relaxed"
                style={{ color: palette.softPurple }}
              >
                It may have been removed or the link is incorrect.
              </p>
              <Link
                to="/properties"
                className="mt-6 inline-flex min-h-11 items-center rounded-lg px-6 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: palette.purple }}
              >
                Browse properties
              </Link>
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
