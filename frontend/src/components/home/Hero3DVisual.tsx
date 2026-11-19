import { useState, type MouseEvent } from "react";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  MapPin,
  TrendingUp,
  Radio,
  Clock,
  Layers,
} from "lucide-react";

export function Hero3DVisual() {
  const [rotate, setRotate] = useState({ x: -4, y: 6 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: -y * 16, y: x * 18 });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: -4, y: 6 });
  };

  return (
    <div
      className="hero-3d-viewport"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="3D Interactive Bengaluru Event Operations Stage"
    >
      {/* Ambient background glow layers */}
      <div className="hero-3d-glow-ambient" />
      <div className="hero-3d-glow-secondary" />

      {/* 3D Scene Container */}
      <div
        className={`hero-3d-scene ${isHovered ? "hovered" : "auto-float"}`}
        style={{
          transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {/* Ground Cyber Grid / Perspective Floor */}
        <div className="hero-3d-floor-grid" />

        {/* Central Holographic Pulsing Orb */}
        <div className="hero-3d-central-orb-wrap">
          <div className="hero-3d-central-orb">
            <div className="orb-inner-core">
              <Sparkles size={28} className="orb-core-icon" />
            </div>
            <div className="orb-orbit-ring ring-1" />
            <div className="orb-orbit-ring ring-2" />
            <div className="orb-orbit-ring ring-3" />
          </div>
        </div>

        {/* 3D Card 1: Live Bengaluru Radar & Operations Hub (Top-Left / Forefront) */}
        <div className="floating-3d-card card-radar animate-float-1">
          <div className="card-glass-header">
            <div className="card-badge-radar">
              <Radio size={13} className="radar-live-icon" />
              <span>LIVE OPERATIONS RADAR</span>
            </div>
            <span className="live-pulse-dot" />
          </div>

          <div className="radar-scope-circle">
            <div className="radar-sweep-beam" />
            <div className="radar-hotspot pin-1" title="Palace Grounds">
              <span className="hotspot-dot" />
              <span className="hotspot-label">Palace Grounds</span>
            </div>
            <div className="radar-hotspot pin-2" title="BIEC Expo">
              <span className="hotspot-dot" />
              <span className="hotspot-label">BIEC Tumkur Rd</span>
            </div>
            <div className="radar-hotspot pin-3" title="Manpho Convention">
              <span className="hotspot-dot" />
              <span className="hotspot-label">Manpho</span>
            </div>
          </div>

          <div className="radar-footer-stats">
            <div className="radar-stat-item">
              <span className="stat-num">500+</span>
              <span className="stat-label">Verified Crew</span>
            </div>
            <div className="radar-stat-divider" />
            <div className="radar-stat-item">
              <span className="stat-num">99.4%</span>
              <span className="stat-label">On-Time Arrival</span>
            </div>
          </div>
        </div>

        {/* 3D Card 2: Shift Progression Hologram (Center Bottom) */}
        <div className="floating-3d-card card-progression animate-float-2">
          <div className="card-prog-top">
            <div className="prog-title-wrap">
              <Layers size={14} className="text-purple" />
              <span className="prog-title">Bengaluru Tech Summit 2026</span>
            </div>
            <span className="status-live-pill">On-Site Active</span>
          </div>

          <div className="prog-venue-line">
            <MapPin size={12} />
            <span>Main Arena · Palace Road, Bengaluru</span>
          </div>

          {/* Stepper Timeline */}
          <div className="prog-steps-mini-track">
            <div className="prog-node-mini done">
              <div className="node-icon-circle">✓</div>
              <span>Booked</span>
            </div>
            <div className="prog-line-mini active" />
            <div className="prog-node-mini current">
              <div className="node-icon-circle pulse-violet">2</div>
              <span>Reporting</span>
            </div>
            <div className="prog-line-mini pending" />
            <div className="prog-node-mini pending">
              <div className="node-icon-circle">3</div>
              <span>Verified Payout</span>
            </div>
          </div>

          {/* Quick Navigation Action Pill */}
          <div className="prog-nav-pill">
            <Navigation size={12} className="nav-arrow-icon" />
            <span>Google Maps GPS Navigation Active</span>
          </div>
        </div>

        {/* 3D Card 3: Instant UPI Daily Settlement (Bottom-Right / Elevated) */}
        <div className="floating-3d-card card-payout animate-float-3">
          <div className="payout-badge-row">
            <div className="payout-verified-badge">
              <ShieldCheck size={14} />
              <span>VERIFIED UPI SETTLEMENT</span>
            </div>
            <span className="instant-settle-tag">Instant</span>
          </div>

          <div className="payout-amount-display">
            <span className="currency-symbol">₹</span>
            <span className="amount-number">3,850</span>
            <span className="amount-credited-label">Credited to UPI</span>
          </div>

          <div className="payout-upi-account-info">
            <CheckCircle2 size={13} className="text-emerald" />
            <span>UPI ID: 9845011223@upi</span>
          </div>

          <div className="payout-progress-mini-bar">
            <div className="payout-bar-fill" />
          </div>
        </div>

        {/* Floating 3D Micro Badges */}
        <div className="floating-3d-chip chip-role animate-float-chip-1">
          <Sparkles size={12} className="text-gold" />
          <span>VIP Hospitality & Crew Lead</span>
        </div>

        <div className="floating-3d-chip chip-rating animate-float-chip-2">
          <TrendingUp size={12} className="text-emerald" />
          <span>4.9★ Top Rated Operations</span>
        </div>

        <div className="floating-3d-chip chip-lock animate-float-chip-3">
          <Clock size={12} className="text-purple" />
          <span>4h Free Cancellation Protected</span>
        </div>
      </div>
    </div>
  );
}
