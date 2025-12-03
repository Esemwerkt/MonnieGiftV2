import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

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
  // Use 4 bytes = 8 hex characters for better security while remaining user-friendly
  // 8 hex chars = 4,294,967,296 possible combinations (much better than 6 chars)
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function generateUniqueVerificationCode(supabase: any, maxRetries: number = 5): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateVerificationCode();
    
    try {
      // Check if code already exists
      const { data: existingGift } = await supabase
        .from('gifts')
        .select('id')
        .eq('authenticationCode', code)
        .single();
      
      // If no existing gift found, code is unique
      if (!existingGift) {
        return code;
      }
      
      console.log(`Verification code collision detected: ${code}, retrying... (attempt ${attempt + 1}/${maxRetries})`);
    } catch (error) {
      // If error (likely "not found"), code is unique
      return code;
    }
  }
  
  // If we've exhausted all retries, throw an error
  throw new Error(`Failed to generate unique verification code after ${maxRetries} attempts`);
}

export function generateMagicLink(email: string): string {
  const token = generateAuthToken(email);
  return `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
}

/**
 * Hash an authentication code for secure storage
 * Uses bcrypt with 10 rounds (good balance of security and performance)
 */
export async function hashAuthenticationCode(code: string): Promise<string> {
  return await bcrypt.hash(code.toUpperCase(), 10);
}

/**
 * Verify an authentication code against a hash
 * Returns true if the code matches the hash
 */
export async function verifyAuthenticationCode(
  code: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(code.toUpperCase(), hash);
}