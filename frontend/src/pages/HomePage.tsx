import {
  ArrowRight,
  Sparkles,
  Briefcase,
  ShieldCheck,
  Building2,
  Lock,
  IndianRupee,
  CalendarCheck,
  Zap,
  Globe,
  Clock,
  Layers,
  MapPin,
  Check,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage, INDIAN_LANGUAGES, type SupportedLanguage } from "../context/LanguageContext";
import { Button } from "../components/common/Button";

interface HomePageProps {
  navigate: (route: string) => void;
}

export function HomePage({ navigate }: HomePageProps) {
  const { currentUser } = useAuth();
  const { language, setLanguage } = useLanguage();

  const handleLanguageSelect = (code: SupportedLanguage) => {
    setLanguage(code);
  };

  return (
    <div className="homepage-wrapper">
      {/* ======================================================== */}
      {/* 1. HERO SECTION (Desktop 2-col, Mobile vertical stack)  */}
      {/* ======================================================== */}
      <section className="hero-section" id="hero">
        <div className="hero-grid-container">
          {/* Left Column: Headline, Description, Feature Highlights, CTAs */}
          <div className="hero-content-col">
            {/* Pill Label */}
            <div className="hero-pill-badge">
              <span className="hero-pill-dot" />
              <Sparkles size={14} className="hero-pill-icon" />
              <span>Bengaluru Crew Hub</span>
            </div>

            {/* Bold Headline */}
            <h1 className="hero-heading">
              Premium Event Crew Staffing &{" "}
              <span className="hero-heading-gradient">Operations Management</span>
            </h1>

            {/* Supporting Text */}
            <p className="hero-subheading">
              Tailored for Bengaluru's exhibitions, expos, conferences, and cultural galas.
              Connect verified event professionals with premier organizers seamlessly.
            </p>

            {/* Three Feature Highlights with Icons */}
            <div className="hero-highlights-row">
              <div className="hero-highlight-item">
                <div className="highlight-icon-box">
                  <Clock size={16} />
                </div>
                <div>
                  <span className="highlight-title">Smart Scheduling</span>
                  <span className="highlight-sub">Real-time slot matching</span>
                </div>
              </div>

              <div className="hero-highlight-item">
                <div className="highlight-icon-box">
                  <Globe size={16} />
                </div>
                <div>
                  <span className="highlight-title">Multi-Language</span>
                  <span className="highlight-sub">11 Indian Languages</span>
                </div>
              </div>

              <div className="hero-highlight-item">
                <div className="highlight-icon-box">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <span className="highlight-title">Secure & Reliable</span>
                  <span className="highlight-sub">Verified UPI payouts</span>
                </div>
              </div>
            </div>

            {/* Two CTA Buttons */}
            <div className="hero-cta-group">
              <Button
                variant="primary"
                size="lg"
                className="btn-purple-gradient hero-primary-btn"
                icon={<ArrowRight size={18} />}
                onClick={() =>
                  navigate(
                    currentUser
                      ? `/${currentUser.role}`
                      : "/auth/signup"
                  )
                }
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hero-secondary-btn"
                icon={<Layers size={18} />}
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Right Column: Bengaluru Vidhana Soudha & Illuminated Event Imagery */}
          <div className="hero-media-col">
            <div className="hero-organic-image-card">
              <img
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=85"
                alt="Bengaluru Grand Event Lighting & Crowd"
                className="hero-main-photo"
                loading="eager"
              />

              {/* Organic Curved Gradient Blend Overlay */}
              <div className="hero-image-curve-blend" />

              {/* Handwritten-style Overlay Badge */}
              <div className="hero-handwritten-overlay">
                <span className="overlay-handwritten-text">Bengaluru Events. Better.</span>
                <span className="overlay-sub-tag">
                  <MapPin size={11} style={{ display: "inline", marginRight: 3 }} />
                  Vidhana Soudha · Palace Grounds · BIEC
                </span>
              </div>

              {/* Live Metric Bubble Overlay */}
              <div className="hero-live-metric-pill">
                <span className="pulse-indicator-dot" />
                <span>500+ Verified Bengaluru Crew On-Duty</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. ROUNDED LAVENDER LANGUAGE BAR (11 Indian Languages)   */}
      {/* ======================================================== */}
      <section className="language-bar-section" id="languages-bar">
        <div className="language-bar-container">
          <div className="language-bar-header">
            <Globe size={18} className="lang-globe-icon" />
            <span className="language-bar-title">Available in 11 Indian Languages:</span>
          </div>

          <div className="language-chips-scroll-wrapper" role="radiogroup" aria-label="Choose platform language">
            {INDIAN_LANGUAGES.map((lang) => {
              const isActive = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-chip-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleLanguageSelect(lang.code)}
                  aria-pressed={isActive}
                  title={`Switch platform language to ${lang.name} (${lang.nativeName})`}
                >
                  <span className="chip-native-text">{lang.nativeName}</span>
                  <span className="chip-english-label">({lang.name})</span>
                  {isActive && <Check size={12} className="chip-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. RESPONSIVE DASHBOARD PREVIEWS (3 Side-by-Side/Stacked)*/}
      {/* ======================================================== */}
      <section className="dashboard-previews-section" id="dashboard-previews">
        <div className="section-heading-center">
          <span className="dashboard-eyebrow">UNIFIED PLATFORM ARCHITECTURE</span>
          <h2 className="section-title-lg">Three Dedicated Consoles for Bengaluru Events</h2>
          <p className="section-subtitle-md">
            Purpose-built workflows tailored for crew professionals, event organizers, and administrative oversight.
          </p>
        </div>

        <div className="dashboard-preview-cards-grid">
          {/* Preview Card 1: Worker Dashboard */}
          <div className="preview-card worker-preview">
            <div className="preview-card-header">
              <div className="preview-icon-bubble worker">
                <Briefcase size={22} />
              </div>
              <div className="preview-header-meta">
                <span className="preview-badge worker">CREW'S PORTAL</span>
                <h3 className="preview-title">Worker Dashboard</h3>
              </div>
            </div>

            <p className="preview-desc">
              Designed for on-site staff. Real-time shift tracking, verified daily payouts via UPI, and venue navigation.
            </p>

            {/* Interactive Mock Snapshot */}
            <div className="preview-mock-window">
              <div className="mock-window-titlebar">
                <span className="mock-dot red" />
                <span className="mock-dot yellow" />
                <span className="mock-dot green" />
                <span className="mock-title">Bengaluru Palace · Ushering Shift</span>
              </div>
              <div className="mock-window-body">
                {/* Progression Bar */}
                <div className="mock-progression-bar">
                  <div className="mock-step done">
                    <span className="mock-step-dot">✓</span>
                    <span>Assigned</span>
                  </div>
                  <div className="mock-step-line done" />
                  <div className="mock-step done">
                    <span className="mock-step-dot">✓</span>
                    <span>Accepted</span>
                  </div>
                  <div className="mock-step-line done" />
                  <div className="mock-step active">
                    <span className="mock-step-dot">3</span>
                    <span>Reporting</span>
                  </div>
                  <div className="mock-step-line" />
                  <div className="mock-step pending">
                    <span className="mock-step-dot">4</span>
                    <span>Completed</span>
                  </div>
                </div>

                {/* Earnings & Navigation Mini Box */}
                <div className="mock-stat-mini-row">
                  <div className="mock-stat-mini-card">
                    <span className="mini-label">Shift Earnings</span>
                    <span className="mini-val">₹2,500</span>
                  </div>
                  <div className="mock-stat-mini-card">
                    <span className="mini-label">Direct Payout</span>
                    <span className="mini-val text-emerald">Verified UPI</span>
                  </div>
                </div>
              </div>
            </div>

            <ul className="preview-features-list">
              <li><Check size={14} className="text-emerald" /> Auto time-based shift progression</li>
              <li><Check size={14} className="text-emerald" /> 4-Hour cancellation grace window</li>
              <li><Check size={14} className="text-emerald" /> 1-Click Google Maps turn-by-turn navigation</li>
            </ul>

            <Button
              variant="primary"
              className="w-full preview-cta-btn"
              icon={<ArrowRight size={15} />}
              onClick={() => navigate(currentUser?.role === "worker" ? "/worker" : "/auth/worker")}
            >
              Enter Crew's Hub
            </Button>
          </div>

          {/* Preview Card 2: Organizer Studio */}
          <div className="preview-card organizer-preview">
            <div className="preview-card-header">
              <div className="preview-icon-bubble organizer">
                <Sparkles size={22} />
              </div>
              <div className="preview-header-meta">
                <span className="preview-badge organizer">EVENT OPERATIONS</span>
                <h3 className="preview-title">Organizer Studio</h3>
              </div>
            </div>

            <p className="preview-desc">
              Command center for event hosts. Post staff requirements, upload venue entrance photos, and verify attendance.
            </p>

            {/* Interactive Mock Snapshot */}
            <div className="mock-window-body" style={{ background: "var(--lavender-white)", borderRadius: 10, padding: 14 }}>
              <div className="mock-window-titlebar" style={{ padding: "0 0 10px", borderBottom: "1px solid var(--border-soft)" }}>
                <span className="mock-title font-semibold">City Lights Cultural Gala</span>
                <span className="badge badge-published" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>Published</span>
              </div>

              <div className="mock-organizer-row" style={{ marginTop: 10 }}>
                <div className="mock-vacancy-bar">
                  <div className="vacancy-text-row">
                    <span>Crew Shortage Tracker:</span>
                    <strong className="text-purple">16 / 28 Assigned (12 Needed)</strong>
                  </div>
                  <div className="vacancy-progress-track">
                    <div className="vacancy-progress-fill" style={{ width: "57%" }} />
                  </div>
                </div>

                <div className="mock-confidential-briefing-pill">
                  <Lock size={12} className="text-amber" />
                  <span>Confidential Briefing Active (Gate 3 Entry Pass)</span>
                </div>
              </div>
            </div>

            <ul className="preview-features-list">
              <li><Check size={14} className="text-purple" /> WebP-compressed venue entrance photo uploads</li>
              <li><Check size={14} className="text-purple" /> 1-Click attendance checkbox with UPI trigger</li>
              <li><Check size={14} className="text-purple" /> Live 7-day crew availability roster</li>
            </ul>

            <Button
              variant="primary"
              className="w-full preview-cta-btn btn-purple-gradient"
              icon={<ArrowRight size={15} />}
              onClick={() => navigate(currentUser?.role === "organizer" ? "/organizer" : "/auth/organizer")}
            >
              Open Organizer Studio
            </Button>
          </div>

          {/* Preview Card 3: Admin Console */}
          <div className="preview-card admin-preview">
            <div className="preview-card-header">
              <div className="preview-icon-bubble admin">
                <Shield size={22} />
              </div>
              <div className="preview-header-meta">
                <span className="preview-badge admin">GOVERNANCE</span>
                <h3 className="preview-title">Admin Console</h3>
              </div>
            </div>

            <p className="preview-desc">
              Platform-wide governance. Review event submissions, manage disciplinary strike policies, and monitor audit logs.
            </p>

            {/* Interactive Mock Snapshot */}
            <div className="mock-window-body" style={{ background: "var(--lavender-white)", borderRadius: 10, padding: 14 }}>
              <div className="mock-window-titlebar" style={{ padding: "0 0 10px", borderBottom: "1px solid var(--border-soft)" }}>
                <span className="mock-title font-semibold">Bengaluru Platform Oversight</span>
                <span className="badge badge-verified" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>Live Audit</span>
              </div>

              <div className="mock-admin-kpi-grid">
                <div className="admin-kpi-mini">
                  <span className="admin-kpi-val text-purple">100%</span>
                  <span className="admin-kpi-lbl">Strict Role Isolation</span>
                </div>
                <div className="admin-kpi-mini">
                  <span className="admin-kpi-val text-emerald">2-Strike</span>
                  <span className="admin-kpi-lbl">No-Show Suspension</span>
                </div>
              </div>

              <div className="admin-n8n-tag">
                <Zap size={11} className="text-amber" />
                <span>n8n Webhook & Database Work Automation Active</span>
              </div>
            </div>

            <ul className="preview-features-list">
              <li><Check size={14} className="text-blue" /> Strict server-side role authorization</li>
              <li><Check size={14} className="text-blue" /> Real-time database event dispatcher</li>
              <li><Check size={14} className="text-blue" /> Automatic 48-hour no-show account suspensions</li>
            </ul>

            <Button
              variant="outline"
              className="w-full preview-cta-btn"
              icon={<ArrowRight size={15} />}
              onClick={() => navigate(currentUser?.role === "admin" ? "/admin" : "/auth/admin")}
            >
              Explore Admin Console
            </Button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. FEATURES & WORKFLOW SECTION                          */}
      {/* ======================================================== */}
      <section className="features-deepdive-section" id="features">
        <div className="section-heading-center">
          <span className="dashboard-eyebrow">BUILT FOR BENGALURU'S SCALE</span>
          <h2 className="section-title-lg">Engineered for Flawless Event Staffing</h2>
          <p className="section-subtitle-md">
            Every feature is calibrated to eliminate delays, prevent staffing shortages, and ensure reliable execution.
          </p>
        </div>

        <div className="features-grid-four">
          <div className="feature-block-card">
            <div className="feature-icon-wrapper bg-lavender">
              <Clock size={24} className="text-purple" />
            </div>
            <h3 className="feature-card-title">Real-Time Slot Matching</h3>
            <p className="feature-card-desc">
              Live slot counters indicate exact staffing requirements (e.g., 16/28 taken). No double bookings or overstaffing.
            </p>
          </div>

          <div className="feature-block-card">
            <div className="feature-icon-wrapper bg-emerald">
              <IndianRupee size={24} className="text-emerald" />
            </div>
            <h3 className="feature-card-title">Direct UPI Payouts</h3>
            <p className="feature-card-desc">
              Workers link their verified UPI phone number. Payouts are credited instantly once organizers verify attendance.
            </p>
          </div>

          <div className="feature-block-card">
            <div className="feature-icon-wrapper bg-blue">
              <CalendarCheck size={24} className="text-blue" />
            </div>
            <h3 className="feature-card-title">4-Hour Cancellation Policy</h3>
            <p className="feature-card-desc">
              Workers can cancel shifts with zero penalty up to 4 hours before reporting, returning slots to the available pool.
            </p>
          </div>

          <div className="feature-block-card">
            <div className="feature-icon-wrapper bg-amber">
              <ShieldCheck size={24} className="text-amber" />
            </div>
            <h3 className="feature-card-title">Verified Attendance Discipline</h3>
            <p className="feature-card-desc">
              Organizers confirm attendance on-site. Unattended shifts trigger payment review and automated disciplinary strikes.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. HOW IT WORKS (3 Simple Steps)                         */}
      {/* ======================================================== */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-heading-center">
          <span className="dashboard-eyebrow">SEAMLESS OPERATIONS</span>
          <h2 className="section-title-lg">How EasyEvent Works</h2>
          <p className="section-subtitle-md">
            From event creation to attendance check-out and direct UPI payouts in three transparent steps.
          </p>
        </div>

        <div className="how-steps-grid">
          <div className="how-step-card step-1">
            <div className="how-step-badge">STEP 1</div>
            <h3 className="how-step-title">Organizer Posts Event</h3>
            <p className="how-step-desc">
              Organizers publish event details, attach venue entrance photos, define required crew counts, and write private briefings.
            </p>
          </div>

          <div className="how-step-card step-2">
            <div className="how-step-badge">STEP 2</div>
            <h3 className="how-step-title">Verified Crew Accepts Shift</h3>
            <p className="how-step-desc">
              Pre-vetted event workers view open duties, apply in one click, receive private briefings, and navigate via Google Maps.
            </p>
          </div>

          <div className="how-step-card step-3">
            <div className="how-step-badge">STEP 3</div>
            <h3 className="how-step-title">On-Site Check-In & Payout</h3>
            <p className="how-step-desc">
              Organizers tick attendance on arrival. Verified shifts trigger instant payout authorization to the worker's UPI ID.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. BOTTOM PURPLE GRADIENT CTA BANNER                     */}
      {/* ======================================================== */}
      <section className="home-bottom-cta-banner">
        <div className="cta-banner-inner">
          <div className="bottom-cta-badge">
            <Zap size={14} className="text-amber" />
            <span>Bengaluru's #1 Event Crew Platform</span>
          </div>
          <h2 className="bottom-cta-title">
            Ready to Elevate Your Event Operations?
          </h2>
          <p className="bottom-cta-subtitle">
            Join 500+ verified crew members and Bengaluru's leading event production agencies today.
          </p>
          <div className="bottom-cta-actions">
            <Button
              variant="primary"
              size="lg"
              className="btn-cta-light"
              icon={<Briefcase size={18} />}
              onClick={() => navigate("/auth/worker")}
            >
              Sign Up as Crew
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="btn-outline-white"
              icon={<Building2 size={18} />}
              onClick={() => navigate("/auth/organizer")}
            >
              Post Event as Organizer
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
