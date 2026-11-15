import { type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options?: readonly string[] | string[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  helper,
  options = [],
  placeholder,
  id,
  className = "",
  children,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`form-field-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}
      <div className={`select-wrapper ${error ? "has-error" : ""}`}>
        <select id={selectId} className="form-select" {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className="select-arrow" size={16} />
      </div>
      {error && <p className="form-error-text">{error}</p>}
      {!error && helper && <p className="form-helper-text">{helper}</p>}
    </div>
  );
}
