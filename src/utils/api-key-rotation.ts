import { logger } from './logger.js';

export interface APIKey {
  name: string;
  key: string;
  createdAt: Date;
  lastRotated: Date;
  expiresAt?: Date;
}

class APIKeyRotation {
  private keys: Map<string, APIKey> = new Map();
  private rotationIntervalDays: number;
  private notificationDays: number;

  constructor() {
    this.rotationIntervalDays = parseInt(
      process.env.API_KEY_ROTATION_INTERVAL_DAYS || '90',
      10
    );
    this.notificationDays = parseInt(
      process.env.API_KEY_ROTATION_NOTIFICATION_DAYS || '7',
      10
    );
  }

  registerKey(name: string, key: string, createdAt: Date = new Date()) {
    const apiKey: APIKey = {
      name,
      key,
      createdAt,
      lastRotated: createdAt,
      expiresAt: new Date(createdAt.getTime() + this.rotationIntervalDays * 24 * 60 * 60 * 1000),
    };
    this.keys.set(name, apiKey);
    logger.info(`API key registered: ${name}`, {
      expiresAt: apiKey.expiresAt,
    });
  }

  checkExpiration(): APIKey[] {
    const now = new Date();
    const expiringKeys: APIKey[] = [];

    this.keys.forEach((apiKey) => {
      if (apiKey.expiresAt) {
        const daysUntilExpiration = Math.floor(
          (apiKey.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysUntilExpiration <= this.notificationDays && daysUntilExpiration >= 0) {
          logger.warn(`API key expiring soon: ${apiKey.name}`, {
            daysUntilExpiration,
          });
          expiringKeys.push(apiKey);
        } else if (daysUntilExpiration < 0) {
          logger.error(`API key expired: ${apiKey.name}`, {
            expiredDays: Math.abs(daysUntilExpiration),
          });
          expiringKeys.push(apiKey);
        }
      }
    });

    return expiringKeys;
  }

  rotateKey(name: string, newKey: string): void {
    const apiKey = this.keys.get(name);
    if (!apiKey) {
      throw new Error(`API key not found: ${name}`);
    }

    const now = new Date();
    apiKey.key = newKey;
    apiKey.lastRotated = now;
    apiKey.expiresAt = new Date(now.getTime() + this.rotationIntervalDays * 24 * 60 * 60 * 1000);

    this.keys.set(name, apiKey);
    logger.info(`API key rotated: ${name}`, {
      expiresAt: apiKey.expiresAt,
    });
  }

  getKey(name: string): string | undefined {
    return this.keys.get(name)?.key;
  }

  listKeys(): APIKey[] {
    return Array.from(this.keys.values());
  }

  startRotationCheck(intervalHours: number = 24): void {
    setInterval(() => {
      logger.debug('Checking API key expiration');
      this.checkExpiration();
    }, intervalHours * 60 * 60 * 1000);

    logger.info('API key rotation check started', {
      intervalHours,
      rotationIntervalDays: this.rotationIntervalDays,
      notificationDays: this.notificationDays,
    });
  }
}

export const apiKeyRotation = new APIKeyRotation();
