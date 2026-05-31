import { useState } from "react";
import LandingFooter from "../../features/landing/components/LandingFooter";
import LandingFeaturedProperties from "../../features/landing/components/LandingFeaturedProperties";
import LandingHero from "../../features/landing/components/LandingHero";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import LandingRoommateCallout from "../../features/landing/components/LandingRoommateCallout";
import LandingTestimonials from "../../features/landing/components/LandingTestimonials";
import LandingTrustBar from "../../features/landing/components/LandingTrustBar";
import LandingWhyChoose from "../../features/landing/components/LandingWhyChoose";
import { useBrowserProperties } from "../../features/property/hooks/usePropertyHooks";

function LandingPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useBrowserProperties({
    page: 1,
    limit: 6,
    search: searchQuery,
  });

  const properties = data?.properties ?? [];

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput.trim());
  };

  return (
    <main style={{ backgroundColor: "var(--palette-page-bg)" }}>
      <LandingNavbar />
      <LandingHero
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />
      <LandingTrustBar />
      <LandingFeaturedProperties
        properties={properties}
        isLoading={isLoading}
        isError={isError}
      />
      <LandingWhyChoose />
      <LandingRoommateCallout />
      <LandingTestimonials />
      <LandingFooter />
    </main>
  );
}

export default LandingPage;
