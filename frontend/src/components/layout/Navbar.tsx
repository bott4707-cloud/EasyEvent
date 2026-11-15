import { useState, useEffect } from "react";
import {
  CalendarDays,
  Menu,
  X,
  LogOut,
  LogIn,
  UserPlus,
  User,
  Shield,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSelector } from "../common/LanguageSelector";
import { Button } from "../common/Button";

interface NavbarProps {
  currentPath: string;
  navigate: (route: string) => void;
  openEnquiryModal?: () => void;
}

export function Navbar({ currentPath, navigate }: NavbarProps) {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasAccount = typeof window !== "undefined" && localStorage.getItem("easyevent_has_account") === "true";

  // Close mobile drawer on route navigation
  const handleNav = (route: string) => {
    navigate(route);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  // Lock background scrolling and support Escape key when mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Accessible skip link for keyboard navigation */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="header-inner">
          {/* Brand */}
          <div className="brand-group">
            <button
              type="button"
              className="brand-logo"
              onClick={() => handleNav("/")}
              aria-label="EasyEvent Home"
            >
              <div className="brand-icon-wrapper">
                <CalendarDays className="brand-icon" size={22} />
              </div>
              <div className="brand-text-wrapper">
                <span className="brand-name">EASYEVENT</span>
                <span className="brand-tagline">Bengaluru Crew Hub</span>
              </div>
            </button>
          </div>

          {/* Desktop Nav - Strictly Isolated per User Role */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            <button
              type="button"
              className={`nav-item ${currentPath === "/" ? "active" : ""}`}
              onClick={() => handleNav("/")}
            >
              {t("nav_home")}
            </button>

            {/* STRICT ACCESS ISOLATION: Only display the panel belonging to the active role */}
            {currentUser?.role === "worker" && (
              <button
                type="button"
                className={`nav-item ${currentPath === "/worker" ? "active" : ""}`}
                onClick={() => handleNav("/worker")}
              >
                <Briefcase size={15} style={{ marginRight: 6 }} /> {t("nav_crews_dash")}
              </button>
            )}

            {currentUser?.role === "organizer" && (
              <button
                type="button"
                className={`nav-item ${currentPath === "/organizer" ? "active" : ""}`}
                onClick={() => handleNav("/organizer")}
              >
                <Sparkles size={15} style={{ marginRight: 6 }} /> {t("nav_organizer_studio")}
              </button>
            )}

            {currentUser?.role === "admin" && (
              <button
                type="button"
                className={`nav-item ${currentPath === "/admin" ? "active" : ""}`}
                onClick={() => handleNav("/admin")}
              >
                <Shield size={15} style={{ marginRight: 6 }} /> {t("nav_admin")}
              </button>
            )}

            <button
              type="button"
              className={`nav-item ${currentPath === "/enquiry" ? "active" : ""}`}
              onClick={() => handleNav("/enquiry")}
            >
              {t("nav_contact")}
            </button>

            <div className="nav-divider" />

            {/* Indian Language Selector */}
            <LanguageSelector variant="header" />

            <div className="nav-divider" />

            {currentUser ? (
              <div className="user-nav-actions">
                <Button
                  variant="primary"
                  size="sm"
                  icon={
                    currentUser.role === "admin" ? (
                      <Shield size={16} />
                    ) : currentUser.role === "organizer" ? (
                      <Sparkles size={16} />
                    ) : (
                      <Briefcase size={16} />
                    )
                  }
                  onClick={() => handleNav(`/${currentUser.role}`)}
                >
                  {currentUser.role === "admin"
                    ? t("nav_admin")
                    : currentUser.role === "organizer"
                    ? t("nav_organizer_studio")
                    : t("nav_crews_dash")}
                </Button>

                <div className="user-profile-pill">
                  <User size={15} className="user-icon" />
                  <span className="user-name">{currentUser.name.split(" ")[0]}</span>
                  <span className="user-role-tag">
                    {currentUser.role === "worker"
                      ? "Crew's"
                      : currentUser.role === "organizer"
                      ? "Event Organizer"
                      : "Admin"}
                  </span>
                </div>

                <button
                  type="button"
                  className="icon-logout-btn"
                  onClick={handleLogout}
                  title={t("nav_signout")}
                  aria-label={t("nav_signout")}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="auth-nav-buttons">
                <Button
                  variant="primary"
                  size="sm"
                  icon={hasAccount ? <LogIn size={15} /> : <UserPlus size={15} />}
                  onClick={() => handleNav(hasAccount ? "/auth/login" : "/auth/signup")}
                >
                  {hasAccount ? t("nav_login") : t("nav_signup")}
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile menu trigger */}
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer & Backdrop */}
        {mobileMenuOpen && (
          <>
            <div
              className="mobile-drawer-backdrop"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              id="mobile-navigation-drawer"
              className="mobile-drawer animate-fade-in"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
            >
              <div className="mobile-drawer-header">
                <span className="mobile-drawer-title">Navigation</span>
                <button
                  type="button"
                  className="mobile-drawer-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="mobile-nav-links">
                <div style={{ marginBottom: 12 }}>
                  <LanguageSelector variant="pill" />
                </div>

                <button
                  type="button"
                  className={`mobile-nav-item ${currentPath === "/" ? "active" : ""}`}
                  onClick={() => handleNav("/")}
                >
                  {t("nav_home")}
                </button>

                {/* Role-isolated panel links */}
                {currentUser?.role === "worker" && (
                  <button
                    type="button"
                    className={`mobile-nav-item ${currentPath === "/worker" ? "active" : ""}`}
                    onClick={() => handleNav("/worker")}
                  >
                    <Briefcase size={16} style={{ marginRight: 8 }} /> {t("nav_crews_dash")}
                  </button>
                )}

                {currentUser?.role === "organizer" && (
                  <button
                    type="button"
                    className={`mobile-nav-item ${currentPath === "/organizer" ? "active" : ""}`}
                    onClick={() => handleNav("/organizer")}
                  >
                    <Sparkles size={16} style={{ marginRight: 8 }} /> {t("nav_organizer_studio")}
                  </button>
                )}

                {currentUser?.role === "admin" && (
                  <button
                    type="button"
                    className={`mobile-nav-item ${currentPath === "/admin" ? "active" : ""}`}
                    onClick={() => handleNav("/admin")}
                  >
                    <Shield size={16} style={{ marginRight: 8 }} /> {t("nav_admin")}
                  </button>
                )}

                <button
                  type="button"
                  className={`mobile-nav-item ${currentPath === "/enquiry" ? "active" : ""}`}
                  onClick={() => handleNav("/enquiry")}
                >
                  {t("nav_contact")}
                </button>

                <div className="mobile-divider" />

                {currentUser ? (
                  <>
                    <div className="mobile-user-info" style={{ marginBottom: 12 }}>
                      <div className="user-profile-pill">
                        <User size={16} />
                        <span>{currentUser.name}</span>
                        <span className="user-role-tag">
                          {currentUser.role === "worker"
                            ? "Crew's"
                            : currentUser.role === "organizer"
                            ? "Event Organizer"
                            : "Admin"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleNav(`/${currentUser.role}`)}
                    >
                      {currentUser.role === "organizer"
                        ? t("nav_organizer_studio")
                        : currentUser.role === "admin"
                        ? t("nav_admin")
                        : t("nav_crews_dash")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      icon={<LogOut size={16} />}
                      onClick={handleLogout}
                      style={{ marginTop: 8 }}
                    >
                      {t("nav_signout")}
                    </Button>
                  </>
                ) : (
                  <div className="mobile-auth-stack">
                    <Button
                      variant="primary"
                      className="w-full"
                      icon={hasAccount ? <LogIn size={16} /> : <UserPlus size={16} />}
                      onClick={() => handleNav(hasAccount ? "/auth/login" : "/auth/signup")}
                    >
                      {hasAccount ? t("nav_login") : t("nav_signup")}
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          </>
        )}
      </header>
    </>
  );
}
