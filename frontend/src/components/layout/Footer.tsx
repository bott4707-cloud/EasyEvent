import { CalendarDays, MapPin, Mail } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export function Footer({ navigate }: { navigate: (route: string) => void }) {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-col brand-col">
          <div className="brand-logo">
            <div className="brand-icon-wrapper">
              <CalendarDays className="brand-icon" size={20} />
            </div>
            <div className="brand-text-wrapper">
              <span className="brand-name">EASYEVENT</span>
              <span className="brand-tagline">Bengaluru Crew Hub</span>
            </div>
          </div>
          <p className="footer-desc">
            {t("footer_tagline")}
          </p>
          <div className="footer-location">
            <MapPin size={16} />
            <span>Bengaluru, Karnataka, India</span>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">{t("footer_col_workspaces")}</h4>
          <ul className="footer-links">
            <li>
              <button type="button" onClick={() => navigate("/")}>
                {t("nav_home")}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate("/worker")}>
                {t("nav_crews")}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate("/organizer")}>
                {t("nav_organizer")}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate("/admin")}>
                {t("nav_admin")}
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">{t("footer_col_duties")}</h4>
          <ul className="footer-links">
            <li><span>{t("footer_duty_reg")}</span></li>
            <li><span>{t("footer_duty_guest")}</span></li>
            <li><span>{t("footer_duty_usher")}</span></li>
            <li><span>{t("footer_duty_stage")}</span></li>
            <li><span>{t("footer_duty_av")}</span></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">{t("footer_col_touch")}</h4>
          <p className="footer-subtext">
            {t("footer_touch_sub")}
          </p>
          <a href="mailto:hello@easyevent.in" className="footer-contact-link">
            <Mail size={16} />
            <span>hello@easyevent.in</span>
          </a>
          <button
            type="button"
            className="footer-enquiry-btn"
            onClick={() => navigate("/enquiry")}
          >
            {t("enquiry_title")} →
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {new Date().getFullYear()} EASYEVENT. {t("footer_rights")}</p>
          <p className="footer-built-with">
            Bengaluru Crew Hub • React & TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
}
