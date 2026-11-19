import { useState, useEffect } from "react";
import {
  CalendarDays,
  LogOut,
  LogIn,
  User,
  Shield,
  Briefcase,
  Sparkles,
  Menu,
  X,
  Globe,
  Layers,
  Info,
  ArrowRight,
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

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleNav = (route: string) => {
    setMobileMenuOpen(false);
    navigate(route);
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (currentPath !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <>
      {/* Accessible skip link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="header-inner">
          {/* Brand Logo with Purple Geometric Icon */}
          <div className="brand-group">
            <button
              type="button"
              className="brand-logo"
              onClick={() => handleNav(currentUser ? `/${currentUser.role}` : "/")}
              aria-label="EasyEvent Bengaluru Crew Hub Home"
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

          {/* Desktop Navigation Links: Home, Features, Languages, About */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            {/* When NOT logged in: Show Public Marketing Nav */}
            {!currentUser && (
              <>
                <button
                  type="button"
                  className={`nav-item ${currentPath === "/" ? "active" : ""}`}
                  onClick={() => handleNav("/")}
                >
                  {t("nav_home")}
                </button>

                <button
                  type="button"
                  className="nav-item"
                  onClick={() => scrollToSection("features")}
                >
                  <Layers size={14} style={{ marginRight: 5 }} /> Features
                </button>

                <button
                  type="button"
                  className="nav-item"
                  onClick={() => scrollToSection("languages-bar")}
                >
                  <Globe size={14} style={{ marginRight: 5 }} /> Languages
                </button>

                <button
                  type="button"
                  className={`nav-item ${currentPath === "/enquiry" ? "active" : ""}`}
                  onClick={() => handleNav("/enquiry")}
                >
                  <Info size={14} style={{ marginRight: 5 }} /> {t("nav_contact")}
                </button>
              </>
            )}

            {/* When Logged In: Show ONLY clean Dashboard controls (NO "Home" link, NO marketing anchors) */}
            {currentUser && (
              <>
                {currentUser.role === "worker" && (
                  <button
                    type="button"
                    className={`nav-item ${currentPath === "/worker" ? "active" : ""}`}
                    onClick={() => handleNav("/worker")}
                  >
                    <Briefcase size={14} style={{ marginRight: 5 }} /> {t("nav_crews_dash")}
                  </button>
                )}

                {currentUser.role === "organizer" && (
                  <button
                    type="button"
                    className={`nav-item ${currentPath === "/organizer" ? "active" : ""}`}
                    onClick={() => handleNav("/organizer")}
                  >
                    <Sparkles size={14} style={{ marginRight: 5 }} /> {t("nav_organizer_studio")}
                  </button>
                )}

                {currentUser.role === "admin" && (
                  <button
                    type="button"
                    className={`nav-item ${currentPath === "/admin" ? "active" : ""}`}
                    onClick={() => handleNav("/admin")}
                  >
                    <Shield size={14} style={{ marginRight: 5 }} /> {t("nav_admin")}
                  </button>
                )}

                <button
                  type="button"
                  className={`nav-item ${currentPath === "/enquiry" ? "active" : ""}`}
                  onClick={() => handleNav("/enquiry")}
                >
                  <Info size={14} style={{ marginRight: 5 }} /> Help & Support
                </button>
              </>
            )}

            <div className="nav-divider" />

            {/* 11-Language Selector Dropdown */}
            <LanguageSelector variant="header" />

            <div className="nav-divider" />

            {/* User Session Actions or Purple Gradient Get Started Button */}
            {currentUser ? (
              <div className="user-nav-actions">
                <div className="user-profile-pill">
                  <User size={14} className="user-icon" />
                  <span className="user-name">{currentUser.name.split(" ")[0]}</span>
                  <span className="user-role-tag">
                    {currentUser.role === "worker"
                      ? "Crew's"
                      : currentUser.role === "organizer"
                      ? "Organizer"
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
              <div className="auth-nav-buttons" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNav("/auth/login")}
                >
                  <LogIn size={14} style={{ marginRight: 5 }} />
                  {t("nav_login")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="btn-purple-gradient"
                  icon={<ArrowRight size={14} />}
                  onClick={() => handleNav("/auth/signup")}
                >
                  Get Started
                </Button>
              </div>
            )}
          </nav>

          {/* Compact Mobile Header with Hamburger Menu */}
          <div className="mobile-header-bar">
            <LanguageSelector variant="header" />

            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Slide-Down Sheet */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer animate-slide-down">
            <div className="mobile-menu-inner">
              {/* Language Switcher Bar at top of Mobile Menu (Replaces generic 'Navigation' title) */}
              <div className="mobile-drawer-lang-header">
                <div className="mobile-drawer-lang-title">
                  <Globe size={16} className="text-purple" />
                  <span>Language / ಭಾಷೆ / भाषा:</span>
                </div>
                <LanguageSelector variant="header" />
              </div>

              <nav className="mobile-nav-links" aria-label="Mobile Navigation">
                {!currentUser ? (
                  <>
                    <button
                      type="button"
                      className={`mobile-nav-link ${currentPath === "/" ? "active" : ""}`}
                      onClick={() => handleNav("/")}
                    >
                      <span>{t("nav_home")}</span>
                    </button>

                    <button
                      type="button"
                      className="mobile-nav-link"
                      onClick={() => scrollToSection("features")}
                    >
                      <Layers size={16} />
                      <span>Features & Workflow</span>
                    </button>

                    <button
                      type="button"
                      className="mobile-nav-link"
                      onClick={() => scrollToSection("languages-bar")}
                    >
                      <Globe size={16} />
                      <span>11 Indian Languages</span>
                    </button>

                    <button
                      type="button"
                      className="mobile-nav-link"
                      onClick={() => scrollToSection("dashboard-previews")}
                    >
                      <Briefcase size={16} />
                      <span>Dashboard Previews</span>
                    </button>

                    <button
                      type="button"
                      className={`mobile-nav-link ${currentPath === "/enquiry" ? "active" : ""}`}
                      onClick={() => handleNav("/enquiry")}
                    >
                      <Info size={16} />
                      <span>About & Contact</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Strictly Logged In: Only role dashboard and support (NO 'Home') */}
                    <button
                      type="button"
                      className={`mobile-nav-link active-role`}
                      onClick={() => handleNav(`/${currentUser.role}`)}
                    >
                      {currentUser.role === "organizer" ? (
                        <Sparkles size={16} />
                      ) : currentUser.role === "admin" ? (
                        <Shield size={16} />
                      ) : (
                        <Briefcase size={16} />
                      )}
                      <span>
                        {currentUser.role === "organizer"
                          ? "Organizer Studio"
                          : currentUser.role === "admin"
                          ? "Admin Console"
                          : "Crew's Dashboard"}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`mobile-nav-link ${currentPath === "/enquiry" ? "active" : ""}`}
                      onClick={() => handleNav("/enquiry")}
                    >
                      <Info size={16} />
                      <span>Help & Contact Support</span>
                    </button>
                  </>
                )}
              </nav>

              <div className="mobile-menu-footer">
                {currentUser ? (
                  <div className="mobile-user-card">
                    <div className="mobile-user-info">
                      <User size={18} className="text-purple" />
                      <div>
                        <div className="font-semibold">{currentUser.name}</div>
                        <div className="text-xs text-muted">{currentUser.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      icon={<LogOut size={14} />}
                      onClick={handleLogout}
                    >
                      {t("nav_signout")}
                    </Button>
                  </div>
                ) : (
                  <div className="mobile-auth-cta-grid">
                    <Button
                      variant="primary"
                      className="btn-purple-gradient w-full"
                      size="lg"
                      icon={<ArrowRight size={16} />}
                      onClick={() => handleNav("/auth/signup")}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      icon={<LogIn size={16} />}
                      onClick={() => handleNav("/auth/login")}
                    >
                      Sign In to Account
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
