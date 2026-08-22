"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  ariaLabel?: string;
};

export default function PasswordField({
  label,
  value,
  onChange,
  name,
  placeholder,
  autoComplete = "new-password",
  required,
  ariaLabel,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const accessibleName = ariaLabel || label || placeholder || "Contraseña";

  return (
    <label className={`plat-password-field${label ? "" : " is-nolabel"}`}>
      {label ? label : <span className="sr-only">{accessibleName}</span>}
      <span className="plat-password-input-wrap">
        <input
          type={visible ? "text" : "password"}
          name={name}
          required={required}
          minLength={8}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={label ? undefined : accessibleName}
        />
        <button
          type="button"
          className="plat-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={0}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}
