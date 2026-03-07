import LandingHeader from "@/components/landing/LandingHeader";
import RestaurantSolution from "@/components/landing/RestaurantSolution";
import ExpertChat from "@/components/landing/ExpertChat";
import { useState } from "react";

const RestaurantSolutionPage = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="relative min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <LandingHeader />
      <RestaurantSolution onDemo={() => setChatOpen(true)} />
      <ExpertChat open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default RestaurantSolutionPage;
