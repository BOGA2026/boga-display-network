import LandingHeader from "@/components/landing/LandingHeader";
import RestaurantSolution from "@/components/landing/RestaurantSolution";
import ExpertChat from "@/components/landing/ExpertChat";
import LegalFooter from "@/components/landing/LegalFooter";
import Seo from "@/components/Seo";
import { useState } from "react";

const RestaurantSolutionPage = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <Seo
        title="Menús digitales para restaurantes | Visualia"
        description="Convierte las pantallas de tu restaurante en menús digitales dinámicos: cambia precios, programa horarios y aumenta ventas. Solución probada en Colombia."
        path="/soluciones/restaurantes"
      />
      <LandingHeader />
      <RestaurantSolution onDemo={() => setChatOpen(true)} />
      <ExpertChat open={chatOpen} onOpenChange={setChatOpen} />
      <LegalFooter />
    </div>
  );
};

export default RestaurantSolutionPage;
