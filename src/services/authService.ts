import {
  User,
  Session,
  PasswordResetToken,
  Invitation,
  LoginAttempt,
  AuditLogEntry,
  UserRole,
  UserScope,
} from '../types';
import { StorageService } from './storageService';

const AUTH_KEYS = {
  USERS: 'reconflow_auth_users',
  SESSIONS: 'reconflow_auth_sessions',
  CURRENT_SESSION: 'reconflow_auth_current_session',
  LOGIN_ATTEMPTS: 'reconflow_auth_login_attempts',
  RESET_TOKENS: 'reconflow_auth_reset_tokens',
  INVITATIONS: 'reconflow_auth_invitations',
  BOOTSTRAP_DONE: 'reconflow_auth_bootstrap_done',
};

// Seed Password constant
const DEFAULT_SEED_PASSWORD = 'ReconFlow!2026';

// Password hashing digest simulation (Argon2id/bcrypt representation)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `argon2id$v=19$m=65536,t=3,p=4$salt_${Math.abs(hash)}$${btoa(password.substring(0, 4) + hash)}`;
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Password Strength Validator (min 12 chars, upper, lower, number, symbol, non-weak)
export function validatePasswordPolicy(password: string): { valid: boolean; reason?: string } {
  if (password.length < 12) {
    return { valid: false, reason: 'Password must be at least 12 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character (!@#$%^&*...).' };
  }
  
  const commonWeak = [
    '123456789012',
    'password1234',
    'reconflow2026',
    'admin1234567',
    'qwerty123456',
  ];
  if (commonWeak.includes(password.toLowerCase())) {
    return { valid: false, reason: 'This password is too common and easily guessed.' };
  }

  return { valid: true };
}

export class AuthService {
  /**
   * Initialize default seed users and bootstrap Super Admin
   */
  static initAuthData(forceReset: boolean = false): void {
    if (forceReset || !localStorage.getItem(AUTH_KEYS.USERS)) {
      const seedUsers: User[] = [
        {
          id: 'USR-SA-01',
          email: 'admin@reconflow.demo',
          name: 'Alemayehu Tadesse',
          phone: '+251911000001',
          passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          tenantId: 'TNT-GLOBAL-01',
          groupId: 'GRP-AFRICA-01',
          companyId: 'LE-ETH-01',
          legalEntityId: 'LE-ETH-01',
          countryCode: 'ET',
          authorizedLegalEntityIds: ['LE-ETH-01', 'LE-KEN-01', 'LE-UGA-01'],
          mustChangePassword: true,
          failedLoginAttempts: 0,
          createdAt: new Date('2026-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          mfaEnabled: false,
        },
        {
          id: 'USR-CA-01',
          email: 'company.admin@reconflow.demo',
          name: 'Bethlehem Alemu',
          phone: '+251911000002',
          passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
          role: 'COMPANY_ADMIN',
          status: 'ACTIVE',
          tenantId: 'TNT-GLOBAL-01',
          groupId: 'GRP-AFRICA-01',
          companyId: 'LE-ETH-01',
          legalEntityId: 'LE-ETH-01',
          countryCode: 'ET',
          authorizedLegalEntityIds: ['LE-ETH-01'],
          mustChangePassword: true,
          failedLoginAttempts: 0,
          createdAt: new Date('2026-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          mfaEnabled: false,
        },
        {
          id: 'USR-FM-01',
          email: 'finance.manager@reconflow.demo',
          name: 'Hiwot Desta',
          phone: '+251911000003',
          passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
          role: 'FINANCE_MANAGER',
          status: 'ACTIVE',
          tenantId: 'TNT-GLOBAL-01',
          groupId: 'GRP-AFRICA-01',
          companyId: 'LE-ETH-01',
          legalEntityId: 'LE-ETH-01',
          countryCode: 'ET',
          authorizedLegalEntityIds: ['LE-ETH-01'],
          mustChangePassword: true,
          failedLoginAttempts: 0,
          createdAt: new Date('2026-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          mfaEnabled: false,
        },
        {
          id: 'USR-RO-01',
          email: 'recon.officer@reconflow.demo',
          name: 'Sara Worku',
          phone: '+251911000004',
          passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
          role: 'RECONCILIATION_OFFICER',
          status: 'ACTIVE',
          tenantId: 'TNT-GLOBAL-01',
          groupId: 'GRP-AFRICA-01',
          companyId: 'LE-ETH-01',
          legalEntityId: 'LE-ETH-01',
          countryCode: 'ET',
          authorizedLegalEntityIds: ['LE-ETH-01'],
          mustChangePassword: true,
          failedLoginAttempts: 0,
          createdAt: new Date('2026-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          mfaEnabled: false,
        },
        {
          id: 'USR-RM-01',
          email: 'regional.manager@reconflow.demo',
          name: 'Tolessa Desta',
          phone: '+251911000005',
          passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
          role: 'REGIONAL_MANAGER',
          status: 'ACTIVE',
          tenantId: 'TNT-GLOBAL-01',
          groupId: 'GRP-AFRICA-01',
          companyId: 'LE-ETH-01',
          legalEntityId: 'LE-ETH-01',
          countryCode: 'ET',
          regionId: 'REG-ORO',
          authorizedLegalEntityIds: ['LE-ETH-01'],
          mustChangePassword: true,
          failedLoginAttempts: 0,
          createdAt: new Date('2026-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          mfaEnabled: false,
        },
        {
          id: 'USR-SM-01',
          email: 'shop.manager@reconflow.demo',
          name: 'Eleni Tesfaye',
          phone: '+251911000006',
          passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
          role: 'SHOP_MANAGER',
          status: 'ACTIVE',
          tenantId: 'TNT-GLOBAL-01',
          groupId: 'GRP-AFRICA-01',
          companyId: 'LE-ETH-01',
          legalEntityId: 'LE-ETH-01',
          countryCode: 'ET',
          regionId: 'REG-ADD',
          shopId: 'SHP-BOL',
          authorizedLegalEntityIds: ['LE-ETH-01'],
          mustChangePassword: true,
          failedLoginAttempts: 0,
          createdAt: new Date('2026-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          mfaEnabled: false,
        },
        {
          id: 'USR-DSA-01',
          email: 'dsa.user@reconflow.demo',
          name: 'Abebe Bikila',
          phone: '+251911000007',
          passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
          role: 'DSA',
          status: 'ACTIVE',
          tenantId: 'TNT-GLOBAL-01',
          groupId: 'GRP-AFRICA-01',
          companyId: 'LE-ETH-01',
          legalEntityId: 'LE-ETH-01',
          countryCode: 'ET',
          regionId: 'REG-ADD',
          shopId: 'SHP-BOL',
          dsaId: 'DSA-101',
          authorizedLegalEntityIds: ['LE-ETH-01'],
          mustChangePassword: true,
          failedLoginAttempts: 0,
          createdAt: new Date('2026-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          mfaEnabled: false,
        },
        {
          id: 'USR-AUD-01',
          email: 'auditor@reconflow.demo',
          name: 'Dr. Solomon Haile',
          phone: '+251911000008',
          passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
          role: 'AUDITOR',
          status: 'ACTIVE',
          tenantId: 'TNT-GLOBAL-01',
          groupId: 'GRP-AFRICA-01',
          companyId: 'LE-ETH-01',
          legalEntityId: 'LE-ETH-01',
          countryCode: 'ET',
          authorizedLegalEntityIds: ['LE-ETH-01'],
          mustChangePassword: true,
          failedLoginAttempts: 0,
          createdAt: new Date('2026-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          mfaEnabled: false,
        },
      ];

      localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(seedUsers));
      localStorage.setItem(AUTH_KEYS.SESSIONS, JSON.stringify([]));
      localStorage.setItem(AUTH_KEYS.LOGIN_ATTEMPTS, JSON.stringify([]));
      localStorage.setItem(AUTH_KEYS.RESET_TOKENS, JSON.stringify([]));
      localStorage.setItem(AUTH_KEYS.INVITATIONS, JSON.stringify([]));
    }
  }

  /**
   * Get all users
   */
  static getAllUsers(): User[] {
    const raw = localStorage.getItem(AUTH_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  }

  /**
   * Save user array
   */
  private static saveUsers(users: User[]): void {
    localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
  }

  /**
   * Get current active session
   */
  static getCurrentSession(): { user: User; session: Session } | null {
    const sessionRaw = localStorage.getItem(AUTH_KEYS.CURRENT_SESSION);
    if (!sessionRaw) return null;

    try {
      const sessionData: Session = JSON.parse(sessionRaw);
      if (sessionData.isRevoked || new Date(sessionData.expiresAt) < new Date()) {
        localStorage.removeItem(AUTH_KEYS.CURRENT_SESSION);
        return null;
      }

      const users = this.getAllUsers();
      const user = users.find((u) => u.id === sessionData.userId);
      if (!user || user.status === 'INACTIVE') {
        localStorage.removeItem(AUTH_KEYS.CURRENT_SESSION);
        return null;
      }

      return { user, session: sessionData };
    } catch {
      localStorage.removeItem(AUTH_KEYS.CURRENT_SESSION);
      return null;
    }
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): User | null {
    const current = this.getCurrentSession();
    return current ? current.user : null;
  }

  /**
   * Authenticate User with Rate Limiting & Account Lockout
   */
  static login(
    emailInput: string,
    passwordInput: string,
    rememberMe: boolean = false,
    clientIp: string = '197.156.64.12',
    userAgent: string = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  ): { success: boolean; user?: User; session?: Session; mustChangePassword?: boolean; message?: string } {
    const email = (emailInput || '').trim().toLowerCase();
    const users = this.getAllUsers();
    const userIndex = users.findIndex((u) => (u.email || '').toLowerCase() === email);

    const now = new Date();
    const nowIso = now.toISOString();

    // Log helper
    const logAttempt = (success: boolean, userId?: string, tenantId?: string, reason?: string) => {
      const attemptsRaw = localStorage.getItem(AUTH_KEYS.LOGIN_ATTEMPTS);
      const attempts: LoginAttempt[] = attemptsRaw ? JSON.parse(attemptsRaw) : [];
      const newAttempt: LoginAttempt = {
        id: `LGN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email,
        userId,
        tenantId,
        timestamp: nowIso,
        success,
        reason,
        ipAddress: clientIp,
        userAgent,
      };
      attempts.unshift(newAttempt);
      localStorage.setItem(AUTH_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts.slice(0, 500)));
    };

    // Generic error message to prevent user enumeration
    const genericError = 'Invalid email or password. Please try again or contact your administrator.';

    if (userIndex === -1) {
      logAttempt(false, undefined, undefined, 'USER_NOT_FOUND');
      return { success: false, message: genericError };
    }

    const user = users[userIndex];

    // Check account status
    if (user.status === 'INACTIVE') {
      logAttempt(false, user.id, user.tenantId, 'ACCOUNT_DEACTIVATED');
      return { success: false, message: 'Your account has been deactivated. Please contact your administrator.' };
    }

    // Check lockout status (5 failed attempts within 15 mins)
    if (user.lockoutUntil && new Date(user.lockoutUntil) > now) {
      const remainingMinutes = Math.ceil((new Date(user.lockoutUntil).getTime() - now.getTime()) / 60000);
      logAttempt(false, user.id, user.tenantId, 'ACCOUNT_LOCKED_ACTIVE');
      return {
        success: false,
        message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minutes.`,
      };
    }

    // Verify password
    const isPasswordValid = verifyPassword(passwordInput, user.passwordHash);

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      let newLockoutUntil: string | undefined = user.lockoutUntil;
      let isNowLocked = false;

      if (newFailedAttempts >= 5) {
        // Lock for 15 minutes
        const lockUntil = new Date(now.getTime() + 15 * 60 * 1000);
        newLockoutUntil = lockUntil.toISOString();
        isNowLocked = true;
      }

      users[userIndex] = {
        ...user,
        failedLoginAttempts: newFailedAttempts,
        status: isNowLocked ? 'LOCKED' : user.status,
        lockoutUntil: newLockoutUntil,
        updatedAt: nowIso,
      };
      this.saveUsers(users);

      logAttempt(false, user.id, user.tenantId, isNowLocked ? 'ACCOUNT_LOCKOUT_TRIGGERED' : 'INVALID_PASSWORD');

      if (isNowLocked) {
        StorageService.addAuditLog(
          this.getUserScopeFromUser(user),
          'ACCOUNT_LOCKOUT',
          'User',
          user.id,
          `Account locked out after 5 failed login attempts from IP ${clientIp}.`
        );
        return {
          success: false,
          message: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.',
        };
      }

      return { success: false, message: genericError };
    }

    // Successful Login
    users[userIndex] = {
      ...user,
      failedLoginAttempts: 0,
      status: user.status === 'LOCKED' ? 'ACTIVE' : user.status,
      lockoutUntil: undefined,
      lastLoginAt: nowIso,
      updatedAt: nowIso,
    };
    this.saveUsers(users);

    // Create session token
    const sessionDurationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    const session: Session = {
      id: `SES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      token: `rt_${Math.random().toString(36).substring(2)}${Date.now()}`,
      tenantId: user.tenantId,
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + sessionDurationMs).toISOString(),
      ipAddress: clientIp,
      userAgent,
      isRevoked: false,
    };

    localStorage.setItem(AUTH_KEYS.CURRENT_SESSION, JSON.stringify(session));

    // Save into session log
    const sessionsRaw = localStorage.getItem(AUTH_KEYS.SESSIONS);
    const sessions: Session[] = sessionsRaw ? JSON.parse(sessionsRaw) : [];
    sessions.unshift(session);
    localStorage.setItem(AUTH_KEYS.SESSIONS, JSON.stringify(sessions));

    // Log success
    logAttempt(true, user.id, user.tenantId, 'SUCCESS');

    StorageService.addAuditLog(
      this.getUserScopeFromUser(user),
      'USER_LOGIN_SUCCESS',
      'User',
      user.id,
      `User ${user.email} (${user.role}) logged in successfully from IP ${clientIp}.`
    );

    return {
      success: true,
      user: users[userIndex],
      session,
      mustChangePassword: user.mustChangePassword,
    };
  }

  /**
   * Change Password (for first login or manual security updates)
   */
  static changePassword(
    userId: string,
    currentPasswordInput: string,
    newPasswordInput: string
  ): { success: boolean; message?: string } {
    const users = this.getAllUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }

    const user = users[userIndex];

    if (!verifyPassword(currentPasswordInput, user.passwordHash)) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    const policy = validatePasswordPolicy(newPasswordInput);
    if (!policy.valid) {
      return { success: false, message: policy.reason };
    }

    if (currentPasswordInput === newPasswordInput) {
      return { success: false, message: 'New password cannot be identical to the temporary/current password.' };
    }

    users[userIndex] = {
      ...user,
      passwordHash: hashPassword(newPasswordInput),
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    };
    this.saveUsers(users);

    // Update current session user
    const currentSessionData = this.getCurrentSession();
    if (currentSessionData && currentSessionData.user.id === userId) {
      localStorage.setItem(
        AUTH_KEYS.CURRENT_SESSION,
        JSON.stringify({
          ...currentSessionData.session,
        })
      );
    }

    StorageService.addAuditLog(
      this.getUserScopeFromUser(user),
      'PASSWORD_CHANGE_SUCCESS',
      'User',
      user.id,
      `Password successfully changed and updated for user ${user.email}.`
    );

    return { success: true, message: 'Password changed successfully.' };
  }

  /**
   * Request Password Reset Link (generates single-use 30-min token)
   */
  static requestPasswordReset(emailInput: string): { success: boolean; message: string; resetToken?: string } {
    const email = (emailInput || '').trim().toLowerCase();
    const users = this.getAllUsers();
    const user = users.find((u) => (u.email || '').toLowerCase() === email);

    // Always return success message to prevent account enumeration
    const genericMsg = 'If an account exists for this email address, a password reset link has been generated.';

    if (!user || user.status === 'INACTIVE') {
      return { success: true, message: genericMsg };
    }

    const tokensRaw = localStorage.getItem(AUTH_KEYS.RESET_TOKENS);
    const tokens: PasswordResetToken[] = tokensRaw ? JSON.parse(tokensRaw) : [];

    const token = `rst_${Math.random().toString(36).substring(2)}${Date.now()}`;
    const newToken: PasswordResetToken = {
      id: `PRT-${Date.now()}`,
      userId: user.id,
      tokenHash: hashPassword(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      used: false,
      createdAt: new Date().toISOString(),
    };

    tokens.unshift(newToken);
    localStorage.setItem(AUTH_KEYS.RESET_TOKENS, JSON.stringify(tokens));

    StorageService.addAuditLog(
      this.getUserScopeFromUser(user),
      'PASSWORD_RESET_REQUESTED',
      'User',
      user.id,
      `Password reset token generated for ${user.email}. Token expires in 30 minutes.`
    );

    return {
      success: true,
      message: genericMsg,
      resetToken: token, // Returned for dev/demo simulation UI
    };
  }

  /**
   * Perform Password Reset using token
   */
  static confirmPasswordReset(
    token: string,
    newPasswordInput: string
  ): { success: boolean; message: string } {
    const tokensRaw = localStorage.getItem(AUTH_KEYS.RESET_TOKENS);
    const tokens: PasswordResetToken[] = tokensRaw ? JSON.parse(tokensRaw) : [];

    const tokenRecordIndex = tokens.findIndex((t) => verifyPassword(token, t.tokenHash) && !t.used);

    if (tokenRecordIndex === -1) {
      return { success: false, message: 'Invalid or expired password reset token.' };
    }

    const tokenRecord = tokens[tokenRecordIndex];
    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return { success: false, message: 'Password reset token has expired. Please request a new link.' };
    }

    const policy = validatePasswordPolicy(newPasswordInput);
    if (!policy.valid) {
      return { success: false, message: policy.reason || 'Password does not meet complexity rules.' };
    }

    const users = this.getAllUsers();
    const userIndex = users.findIndex((u) => u.id === tokenRecord.userId);

    if (userIndex === -1) {
      return { success: false, message: 'User account associated with this token no longer exists.' };
    }

    // Mark token used
    tokens[tokenRecordIndex].used = true;
    localStorage.setItem(AUTH_KEYS.RESET_TOKENS, JSON.stringify(tokens));

    // Update password
    users[userIndex].passwordHash = hashPassword(newPasswordInput);
    users[userIndex].mustChangePassword = false;
    users[userIndex].failedLoginAttempts = 0;
    users[userIndex].status = 'ACTIVE';
    users[userIndex].updatedAt = new Date().toISOString();
    this.saveUsers(users);

    StorageService.addAuditLog(
      this.getUserScopeFromUser(users[userIndex]),
      'PASSWORD_RESET_COMPLETED',
      'User',
      users[userIndex].id,
      `Password successfully reset via token for user ${users[userIndex].email}.`
    );

    return { success: true, message: 'Password reset completed successfully. You can now log in.' };
  }

  /**
   * Log out user
   */
  static logout(): void {
    const sessionData = this.getCurrentSession();
    if (sessionData) {
      StorageService.addAuditLog(
        this.getUserScopeFromUser(sessionData.user),
        'USER_LOGOUT',
        'User',
        sessionData.user.id,
        `User ${sessionData.user.email} logged out.`
      );
    }
    localStorage.removeItem(AUTH_KEYS.CURRENT_SESSION);
  }

  /**
   * Convert User object to UserScope
   */
  static getUserScopeFromUser(user: User): UserScope {
    return {
      userId: user.id,
      userName: user.name,
      role: user.role,
      tenantId: user.tenantId,
      groupId: user.groupId,
      companyId: user.companyId,
      legalEntityId: user.legalEntityId,
      countryCode: user.countryCode,
      regionId: user.regionId,
      shopId: user.shopId,
      dsaId: user.dsaId,
      authorizedLegalEntityIds: user.authorizedLegalEntityIds || [user.legalEntityId],
    };
  }

  /**
   * User Administration Functions (Super Admin & Company Admin)
   */
  static createUser(
    adminUser: User,
    newUser: {
      email: string;
      name: string;
      phone?: string;
      role: UserRole;
      tenantId: string;
      groupId: string;
      legalEntityId: string;
      regionId?: string;
      shopId?: string;
      dsaId?: string;
      temporaryPassword?: string;
      mustChangePassword?: boolean;
    }
  ): { success: boolean; user?: User; message?: string } {
    // Role check
    if (!['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(adminUser.role)) {
      return { success: false, message: 'Permission denied: Only Administrators can create users.' };
    }

    // Tenant / Company Isolation check for Company Admin
    if (adminUser.role === 'COMPANY_ADMIN' && newUser.legalEntityId !== adminUser.legalEntityId) {
      return { success: false, message: 'Company Admin cannot create users outside authorized company scope.' };
    }

    const users = this.getAllUsers();
    if (users.some((u) => (u.email || '').toLowerCase() === (newUser.email || '').trim().toLowerCase())) {
      return { success: false, message: 'A user with this email address already exists.' };
    }

    const tempPass = newUser.temporaryPassword || DEFAULT_SEED_PASSWORD;
    const policy = validatePasswordPolicy(tempPass);
    if (!policy.valid) {
      return { success: false, message: `Initial password invalid: ${policy.reason}` };
    }

    const createdUser: User = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      email: (newUser.email || '').trim().toLowerCase(),
      name: (newUser.name || '').trim(),
      phone: newUser.phone,
      passwordHash: hashPassword(tempPass),
      role: newUser.role,
      status: 'ACTIVE',
      tenantId: newUser.tenantId || adminUser.tenantId,
      groupId: newUser.groupId || adminUser.groupId,
      companyId: newUser.legalEntityId,
      legalEntityId: newUser.legalEntityId,
      countryCode: adminUser.countryCode || 'ET',
      regionId: newUser.regionId,
      shopId: newUser.shopId,
      dsaId: newUser.dsaId,
      authorizedLegalEntityIds: [newUser.legalEntityId],
      mustChangePassword: newUser.mustChangePassword ?? true,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mfaEnabled: false,
    };

    users.push(createdUser);
    this.saveUsers(users);

    StorageService.addAuditLog(
      this.getUserScopeFromUser(adminUser),
      'USER_CREATED',
      'User',
      createdUser.id,
      `Created new user ${createdUser.email} with role ${createdUser.role}.`
    );

    return { success: true, user: createdUser };
  }

  /**
   * Toggle user active/inactive status
   */
  static toggleUserStatus(adminUser: User, targetUserId: string, active: boolean): { success: boolean; message?: string } {
    const users = this.getAllUsers();
    const target = users.find((u) => u.id === targetUserId);

    if (!target) return { success: false, message: 'User not found.' };

    if (adminUser.role === 'COMPANY_ADMIN' && target.legalEntityId !== adminUser.legalEntityId) {
      return { success: false, message: 'Scope Violation: Cannot modify user outside your legal entity.' };
    }

    target.status = active ? 'ACTIVE' : 'INACTIVE';
    target.updatedAt = new Date().toISOString();

    if (!active) {
      this.revokeUserSessions(targetUserId);
    }

    this.saveUsers(users);

    StorageService.addAuditLog(
      this.getUserScopeFromUser(adminUser),
      active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'User',
      target.id,
      `User ${target.email} ${active ? 'activated' : 'deactivated'}. Active sessions revoked.`
    );

    return { success: true };
  }

  /**
   * Revoke active sessions for a user
   */
  static revokeUserSessions(userId: string): void {
    const sessionsRaw = localStorage.getItem(AUTH_KEYS.SESSIONS);
    if (!sessionsRaw) return;

    const sessions: Session[] = JSON.parse(sessionsRaw);
    const updated = sessions.map((s) => (s.userId === userId ? { ...s, isRevoked: true } : s));
    localStorage.setItem(AUTH_KEYS.SESSIONS, JSON.stringify(updated));

    // If current user is revoked, clear session
    const current = this.getCurrentSession();
    if (current && current.user.id === userId) {
      localStorage.removeItem(AUTH_KEYS.CURRENT_SESSION);
    }
  }

  /**
   * Get login attempts audit history
   */
  static getLoginAttempts(): LoginAttempt[] {
    const raw = localStorage.getItem(AUTH_KEYS.LOGIN_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  }
}
