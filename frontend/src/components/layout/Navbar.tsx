import {
  CalendarDays,
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
  const hasAccount = typeof window !== "undefined" && localStorage.getItem("easyevent_has_account") === "true";

  const handleNav = (route: string) => {
    navigate(route);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
              onClick={() => handleNav(currentUser ? `/${currentUser.role}` : "/")}
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
            {/* Once user enters their dashboard, do not show Home */}
            {!currentUser && (
              <button
                type="button"
                className={`nav-item ${currentPath === "/" ? "active" : ""}`}
                onClick={() => handleNav("/")}
              >
                {t("nav_home")}
              </button>
            )}

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
                {currentPath !== `/${currentUser.role}` && (
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
                )}

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

          {/* Mobile Direct Header: Language Selector directly replacing the navigation drawer */}
          <div className="mobile-header-bar">
            <LanguageSelector variant="header" />

            {currentUser ? (
              <div className="mobile-user-quick-actions">
                <button
                  type="button"
                  className="mobile-role-quick-btn"
                  onClick={() => handleNav(`/${currentUser.role}`)}
                  title={currentUser.role === "organizer" ? "Organizer Studio" : "Crew's Hub"}
                  aria-label="Dashboard"
                >
                  {currentUser.role === "organizer" ? (
                    <Sparkles size={16} />
                  ) : currentUser.role === "admin" ? (
                    <Shield size={16} />
                  ) : (
                    <Briefcase size={16} />
                  )}
                </button>
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
              <Button
                variant="primary"
                size="sm"
                icon={hasAccount ? <LogIn size={14} /> : <UserPlus size={14} />}
                onClick={() => handleNav(hasAccount ? "/auth/login" : "/auth/signup")}
              >
                {hasAccount ? t("nav_login") : t("nav_signup")}
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
