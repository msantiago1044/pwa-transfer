export function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isValidSessionId(sessionId: string): boolean {
  return /^[A-Z0-9]{8}$/.test(sessionId);
}

export function getExpirationTime(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now;
}