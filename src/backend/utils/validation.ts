const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidUsername(username: string): boolean {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}
