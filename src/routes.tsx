import { lazy, Suspense, type ComponentType } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
// Layouts eager: el "chrome" (sidebar + topbar) debe ser persistente entre rutas.
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";

import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";
import { Navigate } from "react-router-dom";
import { routeLoaders } from "@/lib/routePrefetch";
import { LEGACY_REDIRECTS, LEGACY_PARAM_REDIRECTS } from "@/config/lexicon";
import LegacyRedirect from "@/components/routing/LegacyRedirect";

/** Envuelve cada página lazy en su propio ErrorBoundary + Suspense. */
function page(Component: ComponentType<any>, key: string) {
  return (
    <RouteErrorBoundary routeKey={key}>
      <Suspense fallback={<PageSkeleton />}>
        <Component />
      </Suspense>
    </RouteErrorBoundary>
  );
}

/** Lazy que comparte el mismo import() del registry de prefetch. */
const lazyRoute = (key: string) => lazy(routeLoaders[key]);

// Públicas
const Login = lazyRoute("/login");
const Register = lazyRoute("/registro");
const Pricing = lazyRoute("/precios");
const AboutPage = lazyRoute("/acerca");
const NosotrosPage = lazy(() => import("@/pages/NosotrosPage"));
const RestaurantSolutionPage = lazyRoute("/soluciones/restaurantes");
const DescargarApk = lazyRoute("/descargar-apk");
const Studio = lazyRoute("/studio");
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const TerminosPage = lazy(() => import("@/pages/TerminosPage"));
const PrivacidadPage = lazy(() => import("@/pages/PrivacidadPage"));
const TvLanding = lazy(() => import("@/pages/TvLanding"));
const Player = lazy(() => import("@/pages/Player"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const VisualiaLunchTemplate = lazy(() => import("@/templates/lunch-dual/VisualiaLunchTemplate"));
const OAuthConsent = lazy(() => import("@/pages/OAuthConsent"));
const ScreensList = lazy(() => import("@/pages/digital-signage/ScreensList"));
const SignageScreenDetail = lazy(() => import("@/pages/digital-signage/ScreenDetail"));
const CampaignLanding = lazy(() => import("@/pages/lp/CampaignLanding"));
const CampaignThanks = lazy(() => import("@/pages/lp/CampaignThanks"));

// Dashboard
const Dashboard = lazyRoute("/dashboard");
const Screens = lazyRoute("/dashboard/pantallas");
const ScreenDetail = lazyRoute("/dashboard/pantallas/:id");
const Content = lazyRoute("/dashboard/contenido");
const Playlists = lazyRoute("/dashboard/listas");
const Schedule = lazyRoute("/dashboard/programacion");
const DashboardMap = lazyRoute("/dashboard/mapa");
const Monitoring = lazyRoute("/dashboard/monitoreo");
const QRCodes = lazyRoute("/dashboard/qr");
const Analytics = lazyRoute("/dashboard/analiticas");
const Subscription = lazyRoute("/dashboard/suscripcion");
const GenerateAI = lazyRoute("/dashboard/generar-ia");
const EditorPage = lazyRoute("/dashboard/editor");
const Soporte = lazyRoute("/dashboard/soporte");
const LeadsPage = lazyRoute("/dashboard/leads");

// Admin
const AdminOverview = lazyRoute("/master");
const AdminTraffic = lazyRoute("/master/trafico");
const AdminSubscriptions = lazyRoute("/master/suscripciones");
const AdminPayments = lazyRoute("/master/pagos");
const AdminScreens = lazyRoute("/master/pantallas");
const AdminMap = lazyRoute("/master/mapa");
const AdminBusinesses = lazyRoute("/master/negocios");
const AdminPQRS = lazyRoute("/master/pqrs");
const AdminSupport = lazyRoute("/master/soporte");
const AdminAdmins = lazyRoute("/master/admins");

export default function AppRoutes() {
  // Fuerza re-mount del boundary por ruta (limpia errores al navegar).
  const { pathname } = useLocation();

  return (
    <Routes key={undefined}>
      <Route path="/" element={<Landing />} />
      <Route path="/precios" element={page(Pricing, pathname)} />
      <Route path="/terminos" element={page(TerminosPage, pathname)} />
      <Route path="/privacidad" element={page(PrivacidadPage, pathname)} />
      <Route path="/legal/terminos" element={page(TerminosPage, pathname)} />
      <Route path="/legal/privacidad" element={page(PrivacidadPage, pathname)} />
      <Route path="/descargar-apk" element={page(DescargarApk, pathname)} />
      <Route path="/tv" element={page(TvLanding, pathname)} />
      <Route path="/onboarding" element={page(Onboarding, pathname)} />

      {/* Landings de tráfico pagado: "gracias" va antes del parámetro. */}
      <Route path="/lp/gracias" element={page(CampaignThanks, pathname)} />
      <Route path="/lp" element={page(CampaignLanding, pathname)} />
      <Route path="/lp/:campana" element={page(CampaignLanding, pathname)} />



      <Route path="/soluciones/restaurantes" element={page(RestaurantSolutionPage, pathname)} />
      <Route path="/acerca" element={page(AboutPage, pathname)} />
      <Route path="/nosotros" element={page(NosotrosPage, pathname)} />
      <Route path="/studio" element={page(Studio, pathname)} />
      <Route path="/login" element={page(Login, pathname)} />
      <Route path="/registro" element={page(Register, pathname)} />
      <Route path="/recuperar" element={page(ForgotPassword, pathname)} />
      <Route path="/player" element={page(Player, pathname)} />
      <Route path="/player/:deviceId" element={page(Player, pathname)} />
      <Route path="/digital-signage/screens" element={page(ScreensList, pathname)} />
      <Route path="/digital-signage/screens/:screenId" element={page(SignageScreenDetail, pathname)} />
      <Route path="/templates/lunch" element={page(VisualiaLunchTemplate, pathname)} />
      <Route path="/oauth/consent" element={page(OAuthConsent, pathname)} />
      <Route path="/.lovable/oauth/consent" element={page(OAuthConsent, pathname)} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={page(Dashboard, pathname)} />
        <Route path="pantallas" element={page(Screens, pathname)} />
        <Route path="pantallas/:id" element={page(ScreenDetail, pathname)} />
        <Route path="mapa" element={page(DashboardMap, pathname)} />
        <Route path="monitoreo" element={page(Monitoring, pathname)} />
        <Route path="qr" element={page(QRCodes, pathname)} />
        <Route path="contenido" element={page(Content, pathname)} />
        <Route path="listas" element={page(Playlists, pathname)} />
        <Route path="listas/:id" element={page(Playlists, pathname)} />
        <Route path="programacion" element={page(Schedule, pathname)} />
        <Route path="analiticas" element={page(Analytics, pathname)} />
        <Route path="suscripcion" element={page(Subscription, pathname)} />
        <Route path="generar-ia" element={page(GenerateAI, pathname)} />
        <Route path="editor" element={page(EditorPage, pathname)} />
        <Route path="leads" element={page(LeadsPage, pathname)} />
        <Route path="soporte" element={page(Soporte, pathname)} />
      </Route>

      <Route path="/master" element={<AdminLayout />}>
        <Route index element={page(AdminOverview, pathname)} />
        <Route path="trafico" element={page(AdminTraffic, pathname)} />
        <Route path="suscripciones" element={page(AdminSubscriptions, pathname)} />
        <Route path="pantallas" element={page(AdminScreens, pathname)} />
        <Route path="pagos" element={page(AdminPayments, pathname)} />
        <Route path="mapa" element={page(AdminMap, pathname)} />
        <Route path="pqrs" element={page(AdminPQRS, pathname)} />
        <Route path="soporte" element={page(AdminSupport, pathname)} />
        <Route path="negocios" element={page(AdminBusinesses, pathname)} />
        <Route path="leads" element={page(LeadsPage, pathname)} />
        <Route path="admins" element={page(AdminAdmins, pathname)} />
      </Route>


      {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
        <Route key={from} path={from} element={<Navigate to={to} replace />} />
      ))}
      {Object.entries(LEGACY_PARAM_REDIRECTS).map(([from, to]) => (
        <Route key={from} path={from} element={<LegacyRedirect to={to} />} />
      ))}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
