import { useState } from "react";
import LandingAudienceCards from "../../features/landing/components/LandingAudienceCards";
import LandingFooter from "../../features/landing/components/LandingFooter";
import LandingFeaturedProperties from "../../features/landing/components/LandingFeaturedProperties";
import LandingHero from "../../features/landing/components/LandingHero";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
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
    <main className="pt-24">
      <LandingNavbar />
      <LandingHero
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />
      <LandingWhyChoose />
      <LandingAudienceCards />
      <LandingFeaturedProperties
        properties={properties}
        isLoading={isLoading}
        isError={isError}
      />
      <LandingFooter />
    </main>
  );
}

export default LandingPage;
