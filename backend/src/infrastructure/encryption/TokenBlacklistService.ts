class TokenBlacklist {
  private blacklist = new Set<string>();
  private expiryTimes = new Map<string, number>();

  add(token: string, expiresAt: number): void {
    this.blacklist.add(token);
    this.expiryTimes.set(token, expiresAt);

    // Auto-remove when token expires
    const ttl = expiresAt - Date.now();
    if (ttl > 0) {
      setTimeout(() => {
        this.remove(token);
      }, ttl);
    }
  }

  isBlacklisted(token: string): boolean {
    if (!this.blacklist.has(token)) {
      return false;
    }

    const expiresAt = this.expiryTimes.get(token);
    if (expiresAt && Date.now() > expiresAt) {
      this.remove(token);
      return false;
    }

    return true;
  }

  remove(token: string): void {
    this.blacklist.delete(token);
    this.expiryTimes.delete(token);
  }

  clear(): void {
    this.blacklist.clear();
    this.expiryTimes.clear();
  }

  size(): number {
    return this.blacklist.size;
  }
}

export const TokenBlacklistService = new TokenBlacklist();
