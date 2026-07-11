import { Hero } from "@/components/landing/Hero";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { DataCoverage } from "@/components/landing/DataCoverage";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturesGrid />
      <DataCoverage />
    </>
  );
}
