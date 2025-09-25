import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

export interface AuthToken {
  email: string;
  iat: number;
  exp: number;
}

export function generateAuthToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken;
  } catch (error) {
    return null;
  }
}

export function generateVerificationCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

export function generateMagicLink(email: string): string {
  const token = generateAuthToken(email);
  return `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
}