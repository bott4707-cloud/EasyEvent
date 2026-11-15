import { useState, type FormEvent } from "react";
import {
  Lock,
  Mail,
  User,
  Shield,
  Briefcase,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import type { Role } from "../types";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { LanguageSelector } from "../components/common/LanguageSelector";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface AuthPageProps {
  initialRole?: Role;
  initialMode?: "signin" | "signup";
  navigate: (route: string) => void;
}

export function AuthPage({ initialRole = "worker", initialMode, navigate }: AuthPageProps) {
  const { login, signup, demoLogin } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [hasAccount] = useState(() => {
    try {
      return localStorage.getItem("easyevent_has_account") === "true";
    } catch {
      return false;
    }
  });

  const [mode, setMode] = useState<"signin" | "signup">(() => {
    if (initialMode) return initialMode;
    // When user has account (returning user / logging in 2nd time) -> "signin" (Log In)
    // When user is creating an account (1st time) -> "signup" (Sign Up)
    return hasAccount ? "signin" : "signup";
  });
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<Role | null>(null);

  const canSignUp = role !== "admin";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !EMAIL_PATTERN.test(cleanEmail)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    if (password.length < 8) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const user = await login(cleanEmail, password);
        try {
          localStorage.setItem("easyevent_has_account", "true");
        } catch {
          // ignore
        }
        showToast(`Welcome back, ${user.name}!`);
        navigate(`/${user.role}`);
      } else {
        if (!name.trim()) {
          showToast("Please enter your full name.", "error");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          showToast("Passwords do not match.", "error");
          setLoading(false);
          return;
        }
        if (role === "admin") {
          showToast("Admin accounts cannot be self-registered.", "error");
          setLoading(false);
          return;
        }

        const user = await signup({
          name: name.trim(),
          email: cleanEmail,
          password,
          role,
        });

        try {
          localStorage.setItem("easyevent_has_account", "true");
        } catch {
          // ignore
        }
        showToast(`Account created! Welcome, ${user.name}.`);
        navigate(`/${user.role}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error occurred.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (targetRole: Role) => {
    setDemoLoadingRole(targetRole);
    try {
      localStorage.setItem("easyevent_has_account", "true");
    } catch {
      // ignore
    }
    try {
      const user = await demoLogin(targetRole);
      showToast(`Logged in instantly as Demo ${targetRole.toUpperCase()}`);
      navigate(`/${user.role}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Demo login failed.";
      showToast(msg, "error");
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-content-box">
        {/* Language selector in upper bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -4 }}>
          <LanguageSelector variant="header" />
        </div>

        {/* Role Selector Header */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`role-tab-btn role-worker ${role === "worker" ? "active" : ""}`}
            onClick={() => setRole("worker")}
          >
            <Briefcase size={16} />
            <span>{t("auth_tab_worker")}</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn role-organizer ${role === "organizer" ? "active" : ""}`}
            onClick={() => setRole("organizer")}
          >
            <Sparkles size={16} />
            <span>{t("auth_tab_organizer")}</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn role-admin ${role === "admin" ? "active" : ""}`}
            onClick={() => {
              setRole("admin");
              setMode("signin");
            }}
          >
            <Shield size={16} />
            <span>{t("auth_tab_admin")}</span>
          </button>
        </div>

        <Card variant="elevated" className={`auth-card role-themed-${role}`}>
          <div className="auth-card-header">
            <span className={`auth-eyebrow eyebrow-${role}`}>
              {role === "admin"
                ? t("auth_eyebrow_admin")
                : role === "organizer"
                  ? t("auth_eyebrow_organizer")
                  : t("auth_eyebrow_worker")}
            </span>
            <h2 className="auth-title">
              {mode === "signin"
                ? role === "worker"
                  ? t("auth_title_signin_worker")
                  : role === "organizer"
                    ? t("auth_title_signin_organizer")
                    : t("auth_title_signin_admin")
                : role === "worker"
                  ? t("auth_title_signup_worker")
                  : t("auth_title_signup_organizer")}
            </h2>
            <p className="auth-subtitle">
              {mode === "signin" ? t("auth_sub_signin") : t("auth_sub_signup")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-stack">
            {mode === "signup" && (
              <Input
                label={t("label_fullname")}
                placeholder="e.g. Rohith N"
                icon={<User size={16} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Input
              label={t("label_email")}
              type="email"
              placeholder={
                role === "admin"
                  ? "admin@easyevent.in"
                  : role === "organizer"
                    ? "organizer@easyevent.in"
                    : "worker@easyevent.in"
              }
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label={t("label_password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              icon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightElement={
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {mode === "signup" && (
              <Input
                label={t("label_confirm_password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                icon={<Lock size={16} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}

            <Button
              variant="primary"
              size="lg"
              type="submit"
              loading={loading}
              className={`w-full auth-submit-btn btn-role-${role}`}
              icon={<ArrowRight size={18} />}
            >
              {mode === "signin"
                ? role === "worker"
                  ? t("btn_signin_worker")
                  : role === "organizer"
                    ? t("btn_signin_organizer")
                    : t("btn_signin_admin")
                : t("btn_create_account")}
            </Button>
          </form>

          {canSignUp && (
            <div className="auth-toggle-mode">
              <span>
                {mode === "signin" ? t("auth_toggle_new") : t("auth_toggle_already")}
              </span>
              <button
                type="button"
                className="mode-switch-btn"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? t("auth_toggle_create") : t("auth_toggle_signin")}
              </button>
            </div>
          )}

          {/* Quick Demo Fill Box for Testing */}
          <div className="demo-credentials-box">
            <span className="demo-box-title">⚡ {t("auth_testdrive_title")}</span>
            <div className="demo-buttons-row">
              <button
                type="button"
                className={`demo-pill-btn worker ${demoLoadingRole === "worker" ? "loading" : ""}`}
                disabled={demoLoadingRole !== null}
                onClick={() => handleDemoFill("worker")}
              >
                {demoLoadingRole === "worker" ? "Signing In..." : t("auth_testdrive_worker")}
              </button>
              <button
                type="button"
                className={`demo-pill-btn organizer ${demoLoadingRole === "organizer" ? "loading" : ""}`}
                disabled={demoLoadingRole !== null}
                onClick={() => handleDemoFill("organizer")}
              >
                {demoLoadingRole === "organizer" ? "Signing In..." : t("auth_testdrive_organizer")}
              </button>
              <button
                type="button"
                className={`demo-pill-btn admin ${demoLoadingRole === "admin" ? "loading" : ""}`}
                disabled={demoLoadingRole !== null}
                onClick={() => handleDemoFill("admin")}
              >
                {demoLoadingRole === "admin" ? "Signing In..." : t("auth_testdrive_admin")}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
