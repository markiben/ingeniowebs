export type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
};

export const PASSWORD_RULES_LABELS = [
  { key: "minLength" as const, label: "8+ caracteres" },
  { key: "uppercase" as const, label: "Una mayúscula" },
  { key: "number" as const, label: "Un número" },
  { key: "special" as const, label: "Un carácter especial" },
];

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordStrong(password: string) {
  const checks = getPasswordChecks(password);
  return (
    checks.minLength &&
    checks.uppercase &&
    checks.number &&
    checks.special
  );
}

export function passwordStrengthError(password: string) {
  if (isPasswordStrong(password)) return null;
  return "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.";
}
