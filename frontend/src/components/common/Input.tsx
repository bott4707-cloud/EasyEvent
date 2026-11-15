import { type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
}

export function Input({
  label,
  error,
  helper,
  icon,
  rightElement,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`form-field-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className={`input-wrapper ${error ? "has-error" : ""}`}>
        {icon && <span className="input-left-icon">{icon}</span>}
        <input
          id={inputId}
          className={`form-input ${icon ? "with-icon" : ""} ${rightElement ? "with-right-element" : ""}`}
          {...props}
        />
        {rightElement && <div className="input-right-element">{rightElement}</div>}
      </div>
      {error && <p className="form-error-text">{error}</p>}
      {!error && helper && <p className="form-helper-text">{helper}</p>}
    </div>
  );
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Textarea({
  label,
  error,
  helper,
  id,
  className = "",
  ...props
}: TextareaProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`form-field-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className={`input-wrapper ${error ? "has-error" : ""}`}>
        <textarea id={inputId} className="form-textarea" rows={4} {...props} />
      </div>
      {error && <p className="form-error-text">{error}</p>}
      {!error && helper && <p className="form-helper-text">{helper}</p>}
    </div>
  );
}
