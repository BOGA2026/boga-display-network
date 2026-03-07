import LandingHeader from "@/components/landing/LandingHeader";
import RestaurantSolution from "@/components/landing/RestaurantSolution";
import PremiumBackground from "@/components/layout/PremiumBackground";
import ExpertChat from "@/components/landing/ExpertChat";
import { useState } from "react";

const RestaurantSolutionPage = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <PremiumBackground>
      <LandingHeader />
      <div className="pt-24">
        <RestaurantSolution onDemo={() => setChatOpen(true)} />
      </div>
      <ExpertChat open={chatOpen} onOpenChange={setChatOpen} />
    </PremiumBackground>
  );
};

export default RestaurantSolutionPage;
