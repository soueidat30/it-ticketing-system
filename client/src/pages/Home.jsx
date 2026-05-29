import { useEffect, useState } from "react";
import Header from "../components/common/Header/Header";
import Footer from "../components/common/Footer/Footer";
import HeroSection from "../components/home/HeroSection";
import FeaturesSection from "../components/home/FeaturesSection";
import ServicesSection from "../components/home/ServicesSection";
import RolesSection from "../components/home/Rolessection";
import StatsSection from "../components/home/Statssection";
import TestimonialsSection from "../components/home/Testimonialssection";
import CTASection from "../components/home/Ctasection";
import LoginModal from "../components/auth/LoginModal/LoginModal";

const Home = () => {
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoginOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const openLogin  = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

  return (
    <>
      <Header onLoginClick={openLogin} />

      <main>
        <HeroSection        onLoginClick={openLogin} />
        <StatsSection />
        <FeaturesSection />
        <ServicesSection />
        <RolesSection />
        <TestimonialsSection />
        <CTASection         onLoginClick={openLogin} />

      </main>

      <Footer onLoginClick={openLogin} />

      <LoginModal isOpen={loginOpen} onClose={closeLogin} />
    </>
  );
};

export default Home;