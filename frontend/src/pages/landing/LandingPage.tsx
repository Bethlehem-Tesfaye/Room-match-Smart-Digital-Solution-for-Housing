import LandingAudienceCards from "../../features/landing/components/LandingAudienceCards";
import LandingFeaturedProperties from "../../features/landing/components/LandingFeaturedProperties";
import LandingHero from "../../features/landing/components/LandingHero";
import LandingWhyChoose from "../../features/landing/components/LandingWhyChoose";
import { useBrowserProperties } from "../../features/property/hooks/usePropertyHooks";

function LandingPage() {
  const {
    data: properties = [],
    isLoading,
    isError,
  } = useBrowserProperties();

  return (
    <main>
      <LandingHero />
      <LandingWhyChoose />
      <LandingAudienceCards />
      <LandingFeaturedProperties
        properties={properties}
        isLoading={isLoading}
        isError={isError}
      />
    </main>
  );
}

export default LandingPage;
