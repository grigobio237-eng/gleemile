import crypto from 'crypto';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24시간 후 만료
  return expiry;
}

export function isTokenExpired(expiry: Date): boolean {
  return new Date() > expiry;
}

