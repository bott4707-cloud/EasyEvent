import {
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Briefcase,
  ShieldCheck,
  Building2,
  Lock,
  IndianRupee,
  Camera,
  CalendarCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/common/Button";

interface HomePageProps {
  navigate: (route: string) => void;
}

export function HomePage({ navigate }: HomePageProps) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="homepage-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>{t("hero_pill")}</span>
          </div>

          <h1 className="hero-heading">
            {t("hero_title_1")} <br />
            <span className="hero-heading-highlight">{t("hero_title_2")}</span>
          </h1>

          <p className="hero-subheading">
            {t("hero_sub")}
          </p>

          <div className="hero-cta-group">
            <Button
              variant="primary"
              size="lg"
              icon={<Briefcase size={18} />}
              onClick={() => navigate(currentUser?.role === "worker" ? "/worker" : "/auth/worker")}
            >
              {t("btn_enter_crews")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={<Building2 size={18} />}
              onClick={() => navigate(currentUser?.role === "organizer" ? "/organizer" : "/auth/organizer")}
            >
              {t("btn_post_org")}
            </Button>
          </div>
        </div>

        {/* Professional Metrics Grid */}
        <div className="home-metrics-grid">
          <div className="metric-card-box">
            <div className="metric-icon-bubble">
              <Users size={22} />
            </div>
            <div>
              <div className="metric-number">500+</div>
              <div className="metric-label">{t("metric_crews")}</div>
            </div>
          </div>

          <div className="metric-card-box">
            <div className="metric-icon-bubble">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="metric-number">98.4%</div>
              <div className="metric-label">{t("metric_punctual")}</div>
            </div>
          </div>

          <div className="metric-card-box">
            <div className="metric-icon-bubble">
              <IndianRupee size={22} />
            </div>
            <div>
              <div className="metric-number">₹12.5L+</div>
              <div className="metric-label">{t("metric_payouts")}</div>
            </div>
          </div>

          <div className="metric-card-box">
            <div className="metric-icon-bubble">
              <Building2 size={22} />
            </div>
            <div>
              <div className="metric-number">45+</div>
              <div className="metric-label">{t("metric_venues")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Pillars Section: For Crew's vs For Event Organizers */}
      <section className="pillars-section">
        {/* For Crew's Card */}
        <div className="pillar-card crews">
          <div>
            <span className="pillar-top-tag">
              <Briefcase size={14} /> {t("pillar_crew_tag")}
            </span>
            <h3 className="pillar-title">{t("pillar_crew_title")}</h3>
            <p className="pillar-desc">
              {t("pillar_crew_desc")}
            </p>

            <ul className="pillar-features-list">
              <li>
                <IndianRupee size={16} className="text-emerald" />
                <span><strong>{t("pillar_crew_f1_strong")}</strong> {t("pillar_crew_f1_text")}</span>
              </li>
              <li>
                <Lock size={16} className="text-amber" />
                <span><strong>{t("pillar_crew_f2_strong")}</strong> {t("pillar_crew_f2_text")}</span>
              </li>
              <li>
                <Camera size={16} className="text-blue" />
                <span><strong>{t("pillar_crew_f3_strong")}</strong> {t("pillar_crew_f3_text")}</span>
              </li>
              <li>
                <CalendarCheck size={16} className="text-emerald" />
                <span><strong>{t("pillar_crew_f4_strong")}</strong> {t("pillar_crew_f4_text")}</span>
              </li>
            </ul>
          </div>

          <Button
            variant="primary"
            icon={<ArrowRight size={16} />}
            onClick={() => navigate(currentUser?.role === "worker" ? "/worker" : "/auth/worker")}
          >
            {t("btn_open_crew_portal")}
          </Button>
        </div>

        {/* For Event Organizers Card */}
        <div className="pillar-card organizer">
          <div>
            <span className="pillar-top-tag">
              <Sparkles size={14} /> {t("pillar_org_tag")}
            </span>
            <h3 className="pillar-title">{t("pillar_org_title")}</h3>
            <p className="pillar-desc">
              {t("pillar_org_desc")}
            </p>

            <ul className="pillar-features-list">
              <li>
                <Camera size={16} className="text-purple" />
                <span><strong>{t("pillar_org_f1_strong")}</strong> {t("pillar_org_f1_text")}</span>
              </li>
              <li>
                <Lock size={16} className="text-amber" />
                <span><strong>{t("pillar_org_f2_strong")}</strong> {t("pillar_org_f2_text")}</span>
              </li>
              <li>
                <Users size={16} className="text-blue" />
                <span><strong>{t("pillar_org_f3_strong")}</strong> {t("pillar_org_f3_text")}</span>
              </li>
              <li>
                <ShieldCheck size={16} className="text-emerald" />
                <span><strong>{t("pillar_org_f4_strong")}</strong> {t("pillar_org_f4_text")}</span>
              </li>
            </ul>
          </div>

          <Button
            variant="primary"
            style={{ background: "var(--organizer)" }}
            icon={<ArrowRight size={16} />}
            onClick={() => navigate(currentUser?.role === "organizer" ? "/organizer" : "/auth/organizer")}
          >
            {t("btn_open_org_studio")}
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="home-section-header-block">
          <span className="dashboard-eyebrow">{t("how_eyebrow")}</span>
          <h2 className="home-section-title">
            {t("how_title")}
          </h2>
          <p className="home-section-subtitle">
            {t("how_subtitle")}
          </p>
        </div>

        <div className="how-steps-grid">
          <div className="how-step-card step-1">
            <div className="how-step-number">1</div>
            <h3 className="how-step-title">{t("how_s1_title")}</h3>
            <p className="how-step-desc">
              {t("how_s1_desc")}
            </p>
          </div>

          <div className="how-step-card step-2">
            <div className="how-step-number">2</div>
            <h3 className="how-step-title">{t("how_s2_title")}</h3>
            <p className="how-step-desc">
              {t("how_s2_desc")}
            </p>
          </div>

          <div className="how-step-card step-3">
            <div className="how-step-number">3</div>
            <h3 className="how-step-title">{t("how_s3_title")}</h3>
            <p className="how-step-desc">
              {t("how_s3_desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="home-bottom-cta-banner">
        <div className="bottom-cta-badge">
          <Zap size={14} className="text-cyan" />
          <span>{t("cta_banner_badge")}</span>
        </div>
        <h2 className="bottom-cta-title">
          {t("cta_banner_title")}
        </h2>
        <p className="bottom-cta-subtitle">
          {t("cta_banner_subtitle")}
        </p>
        <div className="bottom-cta-actions">
          <Button
            variant="primary"
            size="lg"
            icon={<Briefcase size={18} />}
            onClick={() => navigate("/auth/worker")}
          >
            {t("cta_btn_crew")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="btn-outline-white"
            icon={<Building2 size={18} />}
            onClick={() => navigate("/auth/organizer")}
          >
            {t("cta_btn_org")}
          </Button>
        </div>
      </section>
    </div>
  );
}
