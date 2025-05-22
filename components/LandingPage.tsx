import React from 'react';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import HowItWorksSection from './sections/HowItWorksSection';
import ScreenshotsSection from './sections/ScreenshotsSection';
import WhyChooseUsSection from './sections/WhyChooseUsSection';
import FaqSection from './sections/FaqSection';
import CtaSection from './sections/CtaSection';
import Footer from './sections/Footer';
import Navbar from './Navbar';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ScreenshotsSection />
      <WhyChooseUsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default LandingPage;