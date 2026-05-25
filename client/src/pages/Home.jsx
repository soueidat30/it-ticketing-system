import Header from "../components/common/Header/Header";
import HeroSection from "../components/home/HeroSection";
import FeaturesSection from "../components/home/FeaturesSection";
import ServicesSection from "../components/home/ServicesSection";
import StatsSection from "../components/home/StatsSection";
import RolesSection from "../components/home/Rolessection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CTASection from "../components/home/CTASection";
import Footer from "../components/common/Footer/Footer";

function HomePage() {
    return (
    <>
        <Header />
        <HeroSection />
        <FeaturesSection />
        <ServicesSection />
        <StatsSection />
        <RolesSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
    </>
    );
}

export default HomePage;