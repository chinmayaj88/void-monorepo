import { randomBytes } from 'crypto';

interface SessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

export class SessionService {
  private static sessions = new Map<string, SessionData>();
  private static readonly SESSION_DURATION_MS = 3 * 60 * 1000; // 3 minutes

  static createSession(userId: string, email: string): string {
    const token = randomBytes(32).toString('hex');
    const now = Date.now();

    const sessionData: SessionData = {
      userId,
      email,
      createdAt: now,
      expiresAt: now + this.SESSION_DURATION_MS,
    };

    this.sessions.set(token, sessionData);
    this.cleanupExpiredSessions();

    return token;
  }

  static getSession(token: string): SessionData | null {
    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }


  static deleteSession(token: string): void {
    this.sessions.delete(token);
  }

  private static cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
      }
    }
  }
}
