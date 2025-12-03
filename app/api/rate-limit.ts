// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs
    };
  }
  
  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }
  
  // Increment count
  current.count++;
  rateLimitMap.set(key, current);
  
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime
  };
}

// Export map for advanced operations like IP blocking
export function getRateLimitMap() {
  return rateLimitMap;
}

// Block an IP for a specific duration
export function blockIP(ip: string, durationMs: number) {
  const blockKey = `blocked-ip-${ip}`;
  rateLimitMap.set(blockKey, {
    count: 1,
    resetTime: Date.now() + durationMs
  });
}

// Check if an IP is blocked
export function isIPBlocked(ip: string): boolean {
  const blockKey = `blocked-ip-${ip}`;
  const blockEntry = rateLimitMap.get(blockKey);
  
  if (!blockEntry) return false;
  
  if (Date.now() > blockEntry.resetTime) {
    // Block expired, remove it
    rateLimitMap.delete(blockKey);
    return false;
  }
  
  return true;
}

// Get remaining block time for an IP
export function getBlockRemainingTime(ip: string): number {
  const blockKey = `blocked-ip-${ip}`;
  const blockEntry = rateLimitMap.get(blockKey);
  
  if (!blockEntry) return 0;
  
  const remaining = blockEntry.resetTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

// Clear failed attempts counter (called on successful verification)
export function clearFailedAttempts(ip: string) {
  const failedAttemptsKey = `failed-attempts-${ip}`;
  rateLimitMap.delete(failedAttemptsKey);
}
