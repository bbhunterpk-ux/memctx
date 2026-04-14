import { useLenis } from "@/hooks/useLenis";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ComparisonSection from "@/components/ComparisonSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import InstallationSection from "@/components/InstallationSection";
import CLISection from "@/components/CLISection";
import ProductShowcase from "@/components/ProductShowcase";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  useLenis();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ProductShowcase />
      <ComparisonSection />
      <ArchitectureSection />
      <InstallationSection />
      <CLISection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
