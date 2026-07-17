import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Auth & light pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const TerminosPage = lazy(() => import("./pages/TerminosPage"));
const PrivacidadPage = lazy(() => import("./pages/PrivacidadPage"));
const DescargarApk = lazy(() => import("./pages/DescargarApk"));
const TvLanding = lazy(() => import("./pages/TvLanding"));
const RestaurantSolutionPage = lazy(() => import("./pages/RestaurantSolutionPage"));
const Studio = lazy(() => import("./pages/Studio"));
const Player = lazy(() => import("./pages/Player"));
const VisualiaLunchTemplate = lazy(() => import("./templates/lunch-dual/VisualiaLunchTemplate"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

// Dashboard (heavy)
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Screens = lazy(() => import("./pages/Screens"));
const Content = lazy(() => import("./pages/Content"));
const Playlists = lazy(() => import("./pages/Playlists"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Subscription = lazy(() => import("./pages/Subscription"));
const GenerateAI = lazy(() => import("./pages/GenerateAI"));
const EditorPage = lazy(() => import("./pages/EditorPage"));
const AdminLeadsPage = lazy(() => import("./pages/AdminLeadsPage"));
const ScreensList = lazy(() => import("./pages/digital-signage/ScreensList"));
const ScreenDetail = lazy(() => import("./pages/digital-signage/ScreenDetail"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses"));
const AdminAdmins = lazy(() => import("./pages/admin/AdminAdmins"));
const AdminTraffic = lazy(() => import("./pages/admin/AdminTraffic"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminScreens = lazy(() => import("./pages/admin/AdminScreens"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminMap = lazy(() => import("./pages/admin/AdminMap"));
const AdminPQRS = lazy(() => import("./pages/admin/AdminPQRS"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const Soporte = lazy(() => import("./pages/Soporte"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Public pages are largely static; keep responses fresh for 5 min and in
      // memory for 30 min so back/forward + repeated visits are instant.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/precios" element={<Pricing />} />
            <Route path="/terminos" element={<TerminosPage />} />
            <Route path="/privacidad" element={<PrivacidadPage />} />
            <Route path="/descargar-apk" element={<DescargarApk />} />
            <Route path="/tv" element={<TvLanding />} />
            <Route path="/soluciones/restaurantes" element={<RestaurantSolutionPage />} />
            <Route path="/acerca" element={<AboutPage />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/recuperar" element={<ForgotPassword />} />
            <Route path="/player" element={<Player />} />
            <Route path="/player/:deviceId" element={<Player />} />
            <Route path="/digital-signage/screens" element={<ScreensList />} />
            <Route path="/digital-signage/screens/:screenId" element={<ScreenDetail />} />
            <Route path="/templates/lunch" element={<VisualiaLunchTemplate />} />
            <Route path="/oauth/consent" element={<OAuthConsent />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
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
              <Route path="soporte" element={<Soporte />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="trafico" element={<AdminTraffic />} />
              <Route path="suscripciones" element={<AdminSubscriptions />} />
              <Route path="pantallas" element={<AdminScreens />} />
              <Route path="pagos" element={<AdminPayments />} />
              <Route path="mapa" element={<AdminMap />} />
              <Route path="pqrs" element={<AdminPQRS />} />
              <Route path="soporte" element={<AdminSupport />} />
              <Route path="negocios" element={<AdminBusinesses />} />
              <Route path="leads" element={<AdminLeadsPage />} />
              <Route path="admins" element={<AdminAdmins />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
