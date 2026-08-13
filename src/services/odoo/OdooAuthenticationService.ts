import { OdooConfig } from '../../types';

export interface OdooAuthSession {
  uid: number;
  sessionId: string;
  userContext: {
    lang: string;
    tz: string;
    uid: number;
    company_id: number;
  };
  expiresAtUtc: string;
}

export class OdooAuthenticationService {
  private static sessionCache: Map<string, OdooAuthSession> = new Map();

  /**
   * Masks sensitive API keys or passwords for UI display
   */
  static maskCredential(credential: string): string {
    if (!credential) return '';
    if (credential.length <= 4) return '••••';
    return `${credential.slice(0, 2)}••••••••${credential.slice(-2)}`;
  }

  /**
   * Authenticates service-account with Odoo server
   */
  static async authenticate(config: OdooConfig): Promise<{
    success: boolean;
    session?: OdooAuthSession;
    error?: string;
  }> {
    if (!config.isEnabled) {
      return { success: false, error: 'Odoo integration is disabled for this Legal Entity.' };
    }

    if (!config.instanceUrl || !config.databaseName || !config.username) {
      return { success: false, error: 'Missing required Odoo connection parameters.' };
    }

    // Check cached session
    const cacheKey = `${config.instanceUrl}:${config.databaseName}:${config.username}`;
    const cached = OdooAuthenticationService.sessionCache.get(cacheKey);
    if (cached && new Date(cached.expiresAtUtc) > new Date()) {
      return { success: true, session: cached };
    }

    // Simulate RPC Authentication call to Odoo instance (e.g. /jsonrpc or /xmlrpc/2/common)
    try {
      // Validate instance URL format
      const parsedUrl = new URL(config.instanceUrl);
      if (!parsedUrl.protocol.startsWith('http')) {
        throw new Error('Invalid URL protocol');
      }

      // Mocked successful Odoo Session creation
      const mockUid = 2; // Odoo admin / service account UID
      const session: OdooAuthSession = {
        uid: mockUid,
        sessionId: `odoo_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userContext: {
          lang: 'en_US',
          tz: 'UTC',
          uid: mockUid,
          company_id: config.odooCompanyId || 1,
        },
        expiresAtUtc: new Date(Date.now() + 3600 * 1000 * 4).toISOString(), // 4 hours
      };

      OdooAuthenticationService.sessionCache.set(cacheKey, session);

      return { success: true, session };
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to authenticate with Odoo instance at ${config.instanceUrl}: ${
          err.message || 'Network error'
        }`,
      };
    }
  }

  /**
   * Invalidates active session
   */
  static clearSession(config: OdooConfig): void {
    const cacheKey = `${config.instanceUrl}:${config.databaseName}:${config.username}`;
    OdooAuthenticationService.sessionCache.delete(cacheKey);
  }
}
