import RestaurantParallaxHero from "@/components/restaurant/RestaurantParallaxHero";
import ScrollDepthScene from "@/components/restaurant/ScrollDepthScene";
import RealLifeScenario from "@/components/restaurant/RealLifeScenario";
import BenefitCards from "@/components/restaurant/BenefitCards";
import FinalCTA from "@/components/restaurant/FinalCTA";

const RestaurantSolution = ({ onDemo }: { onDemo: () => void }) => (
  <div>
    <RestaurantParallaxHero onDemo={onDemo} />
    <ScrollDepthScene />
    <RealLifeScenario />
    <BenefitCards />
    <FinalCTA onDemo={onDemo} />
  </div>
);

export default RestaurantSolution;
