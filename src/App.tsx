import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import Screens from "./pages/Screens";
import Content from "./pages/Content";
import Playlists from "./pages/Playlists";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import Player from "./pages/Player";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Studio from "./pages/Studio";
import ScreensList from "./pages/digital-signage/ScreensList";
import ScreenDetail from "./pages/digital-signage/ScreenDetail";
import VisualiaLunchTemplate from "./templates/lunch-dual/VisualiaLunchTemplate";
import EditorPage from "./pages/EditorPage";
import GenerateAI from "./pages/GenerateAI";
import RestaurantSolutionPage from "./pages/RestaurantSolutionPage";
import AdminLeadsPage from "./pages/AdminLeadsPage";
import AboutPage from "./pages/AboutPage";
import TerminosPage from "./pages/TerminosPage";
import PrivacidadPage from "./pages/PrivacidadPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/precios" element={<Pricing />} />
          {/* CORRECCIÓN 11 — Rutas para páginas legales */}
          <Route path="/terminos" element={<TerminosPage />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />
          <Route path="/soluciones/restaurantes" element={<RestaurantSolutionPage />} />
          <Route path="/acerca" element={<AboutPage />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar" element={<ForgotPassword />} />
          <Route path="/player/:deviceId" element={<Player />} />
          <Route path="/digital-signage/screens" element={<ScreensList />} />
          <Route path="/digital-signage/screens/:screenId" element={<ScreenDetail />} />
          <Route path="/templates/lunch" element={<VisualiaLunchTemplate />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pantallas" element={<Screens />} />
            <Route path="contenido" element={<Content />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="programacion" element={<Schedule />} />
            <Route path="analiticas" element={<Analytics />} />
            <Route path="suscripcion" element={<Subscription />} />
            <Route path="generar-ia" element={<GenerateAI />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
