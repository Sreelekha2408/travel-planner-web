export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string };

const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];

// One point each: 8+ characters, letters and numbers, upper and lower case,
// and a symbol or 12+ characters. Drives the 4-bar meter on the sign-up form.
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, label: "" };
  const checks = [
    password.length >= 8,
    /[A-Za-z]/.test(password) && /\d/.test(password),
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[^A-Za-z0-9]/.test(password) || password.length >= 12,
  ];
  const score = checks.filter(Boolean).length as PasswordStrength["score"];
  return { score, label: labels[score] };
}

// The same rule the backend enforces.
export function meetsPasswordRule(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}
