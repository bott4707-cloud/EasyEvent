import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, INDIAN_LANGUAGES, type SupportedLanguage } from "../../context/LanguageContext";

interface LanguageSelectorProps {
  variant?: "header" | "pill";
  className?: string;
}

export function LanguageSelector({ variant = "header", className = "" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`language-selector-wrapper ${variant} ${className}`}
      title="Change Language (Indian Languages)"
    >
      <button
        type="button"
        className={`lang-trigger-btn ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={15} className="lang-icon" />
        <span className="lang-current-native">{currentOption.nativeName}</span>
        {currentOption.nativeName !== currentOption.name && (
          <span className="lang-current-code">({currentOption.name})</span>
        )}
        <ChevronDown size={13} className={`lang-chevron ${open ? "rotate" : ""}`} />
      </button>

      {open && (
        <div className="lang-dropdown-menu animate-fade-in" role="listbox">
          <div className="lang-dropdown-header">
            <span>Select Indian Language</span>
          </div>
          <div className="lang-options-grid">
            {INDIAN_LANGUAGES.map((opt) => {
              const isSelected = opt.code === language;
              return (
                <button
                  key={opt.code}
                  type="button"
                  className={`lang-option-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.code)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="lang-text-group">
                    <span className="lang-native-bold">{opt.nativeName}</span>
                    <span className="lang-english-sub">{opt.name}</span>
                  </div>
                  {isSelected && <Check size={14} className="lang-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
