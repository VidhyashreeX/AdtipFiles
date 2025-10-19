import Hero from "@/components/publisher/Hero";
import ComparisonTable from "@/components/publisher/ComparisonTable";
import AdFormats from "@/components/publisher/AdFormats";
import Steps from "@/components/publisher/Steps";
import Analytics from "@/components/publisher/Analytics";
import Benefits from "@/components/publisher/Benefits";
import CTA from "@/components/publisher/CTA";

const Publisher = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <ComparisonTable />
      <AdFormats />
      <Steps />
      <Analytics />
      <Benefits />
      <CTA />
    </main>
  );
};

export default Publisher;
