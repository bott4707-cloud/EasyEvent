import { useState, useEffect, useCallback, lazy, Suspense, type ReactNode } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { LoadingFallback } from "./components/common/LoadingFallback";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { GeneralEnquiryForm } from "./components/forms/GeneralEnquiryForm";
import { Card } from "./components/common/Card";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "./components/common/Button";

// Route-level code-splitting for high performance and reduced initial JS bundle size
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const WorkerDashboard = lazy(() =>
  import("./pages/WorkerDashboard").then((m) => ({ default: m.WorkerDashboard }))
);
const OrganizerDashboard = lazy(() =>
  import("./pages/OrganizerDashboard").then((m) => ({ default: m.OrganizerDashboard }))
);
const AdminDashboard = lazy(() =>
  import("./pages/AdminDashboard").then((m) => ({ default: m.AdminDashboard }))
);
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((m) => ({ default: m.AuthPage }))
);

function AppContent() {
  const [path, setPath] = useState(window.location.pathname);
  const { t } = useLanguage();

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((route: string) => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, "", route);
    }
    setPath(route);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  let pageContent: ReactNode;

  if (path === "/worker") {
    pageContent = <WorkerDashboard navigate={navigate} />;
  } else if (path === "/organizer") {
    pageContent = <OrganizerDashboard navigate={navigate} />;
  } else if (path === "/admin") {
    pageContent = <AdminDashboard navigate={navigate} />;
  } else if (path.startsWith("/auth/signup")) {
    pageContent = <AuthPage initialRole="worker" initialMode="signup" navigate={navigate} />;
  } else if (path.startsWith("/auth/login")) {
    pageContent = <AuthPage initialRole="worker" initialMode="signin" navigate={navigate} />;
  } else if (path.startsWith("/auth/worker")) {
    pageContent = <AuthPage initialRole="worker" navigate={navigate} />;
  } else if (path.startsWith("/auth/organizer")) {
    pageContent = <AuthPage initialRole="organizer" navigate={navigate} />;
  } else if (path.startsWith("/auth/admin")) {
    pageContent = <AuthPage initialRole="admin" navigate={navigate} />;
  } else if (path.startsWith("/auth")) {
    pageContent = <AuthPage initialRole="worker" navigate={navigate} />;
  } else if (path === "/enquiry") {
    pageContent = (
      <div className="dashboard-page-container enquiry-page-container">
        <div className="dashboard-header-block text-center">
          <div>
            <span className="dashboard-eyebrow">{t("enquiry_eyebrow")}</span>
            <h1 className="dashboard-title">{t("enquiry_title")}</h1>
            <p className="dashboard-subtitle">
              {t("enquiry_subtitle")}
            </p>
          </div>
        </div>

        <Card variant="elevated" className="enquiry-card-wrapper">
          <div className="enquiry-card-header">
            <Mail className="enquiry-header-icon" size={24} />
            <div>
              <h3>{t("enquiry_card_title")}</h3>
              <p className="muted-text">{t("enquiry_card_subtitle")}</p>
            </div>
          </div>
          <GeneralEnquiryForm />
          <div className="enquiry-back-row">
            <Button
              variant="ghost"
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate("/")}
            >
              {t("btn_back_home")}
            </Button>
          </div>
        </Card>
      </div>
    );
  } else {
    pageContent = <HomePage navigate={navigate} />;
  }

  return (
    <div className="app-shell">
      <Navbar currentPath={path} navigate={navigate} />
      <main className="main-viewport" id="main-content" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>{pageContent}</Suspense>
        </ErrorBoundary>
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
