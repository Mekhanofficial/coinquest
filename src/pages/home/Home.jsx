import ContactUs from "../../components/contact/ContactIndex.jsx";
import HomeHeaderPage from "../../components/home/layout/HomeHeader.jsx";
import FooterPage from "../../components/home/layout/Footer.jsx";
import StatsPage from "./Stats.jsx";
import WhatIscoinquestPage from "./WhatIsKoinfu.jsx";
import FeaturesSection from "./FeaturesSection.jsx";
import TokenSection from "./TokenSection.jsx";
import ProfitCalculator from "./ProfitCalculator.jsx";
import TestimonyPage from "./Testimonials.jsx";
import QuestionAndAnswer from "./QuestionAndAnswer.jsx";
import PricingPlan from "./PricingPlan.jsx";
import HeroPage from "./Hero.jsx";
import RandomAlert from "../../constants/RandomAlert.jsx";
import ChatBot from "../../components/chatbot/ChatBot.jsx";
import { SmoothScrollProvider } from "../../components/ui/SmoothScrollProvider.jsx";

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <section className="overflow-x-hidden" style={{ height: "100vh" }}>
        <HomeHeaderPage />
        <HeroPage />
        <StatsPage />
        <WhatIscoinquestPage />
        <FeaturesSection />
        <TokenSection />
        <ProfitCalculator />
        <TestimonyPage />
        <QuestionAndAnswer />
        <PricingPlan />
        <ContactUs />
        <FooterPage />
        <RandomAlert />
        <ChatBot />
      </section>
    </SmoothScrollProvider>
  );
}
