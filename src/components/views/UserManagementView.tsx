import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  RotateCcw,
  KeyRound,
  CheckCircle2,
  XCircle,
  Building,
  MapPin,
  Store,
  Clock,
  History,
  Mail,
  Smartphone,
  Sparkles,
  AlertTriangle,
  UserCheck,
  UserX,
  MoreVertical,
} from 'lucide-react';
import { User, UserRole, UserScope, UserStatus, LoginAttempt } from '../../types';
import { AuthService, validatePasswordPolicy } from '../../services/authService';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { StatCard } from '../common/StatCard';
import { useConfig } from '../../context/ConfigContext';

interface UserManagementViewProps {
  userScope: UserScope;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ userScope }) => {
  const { allLegalEntities } = useConfig();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);

  // Form states for creating/inviting user
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('RECONCILIATION_OFFICER');
  const [newUserLegalEntityId, setNewUserLegalEntityId] = useState(userScope.legalEntityId || 'LE-ETH-01');
  const [newUserRegionId, setNewUserRegionId] = useState<string>('REG-ADD');
  const [newUserShopId, setNewUserShopId] = useState<string>('');
  const [newUserTempPassword, setNewUserTempPassword] = useState('ReconFlow!2026');
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Load Users
  const refreshUsers = () => {
    const all = AuthService.getAllUsers();
    // Scope filter for Company Admin
    if (userScope.role === 'COMPANY_ADMIN') {
      setUsers(all.filter((u) => u.legalEntityId === userScope.legalEntityId));
    } else {
      setUsers(all);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, [userScope]);

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const currentUserObj = users.find((u) => u.id === userScope.userId) || {
      id: userScope.userId,
      email: 'admin@reconflow.demo',
      name: userScope.userName,
      passwordHash: '',
      role: userScope.role,
      status: 'ACTIVE' as const,
      tenantId: userScope.tenantId,
      groupId: userScope.groupId,
      companyId: userScope.companyId,
      legalEntityId: userScope.legalEntityId,
      countryCode: userScope.countryCode,
      authorizedLegalEntityIds: userScope.authorizedLegalEntityIds,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      createdAt: '',
      updatedAt: '',
      mfaEnabled: false,
    };

    const res = AuthService.createUser(currentUserObj, {
      email: newUserEmail,
      name: newUserName,
      phone: newUserPhone,
      role: newUserRole,
      tenantId: userScope.tenantId || 'TNT-GLOBAL-01',
      groupId: userScope.groupId || 'GRP-AFRICA-01',
      legalEntityId: newUserLegalEntityId,
      regionId: newUserRegionId || undefined,
      shopId: newUserShopId || undefined,
      temporaryPassword: newUserTempPassword,
      mustChangePassword: requirePasswordChange,
    });

    if (res.success && res.user) {
      setFormSuccess(`User ${res.user.email} successfully created and assigned role ${res.user.role}.`);
      refreshUsers();
      setTimeout(() => {
        setShowCreateModal(false);
        setFormSuccess('');
        setNewUserEmail('');
        setNewUserName('');
        setNewUserPhone('');
      }, 1500);
    } else {
      setFormError(res.message || 'Failed to create user.');
    }
  };

  const handleToggleStatus = (targetUser: User) => {
    const isCurrentlyActive = targetUser.status === 'ACTIVE';
    const currentUserObj = users.find((u) => u.id === userScope.userId) || targetUser;

    const res = AuthService.toggleUserStatus(currentUserObj, targetUser.id, !isCurrentlyActive);

    if (res.success) {
      refreshUsers();
    } else {
      alert(res.message);
    }
  };

  const handleResetPassword = (targetUser: User) => {
    const newTemp = prompt(
      `Set temporary password for ${targetUser.email} (min 12 chars, must contain upper, lower, number, special):`,
      'ReconFlow!2026'
    );
    if (!newTemp) return;

    const policy = validatePasswordPolicy(newTemp);
    if (!policy.valid) {
      alert(`Invalid password: ${policy.reason}`);
      return;
    }

    const all = AuthService.getAllUsers();
    const idx = all.findIndex((u) => u.id === targetUser.id);
    if (idx !== -1) {
      all[idx].passwordHash = `argon2id$v=19$m=65536,t=3,p=4$salt_${Date.now()}$${btoa(newTemp)}`;
      all[idx].mustChangePassword = true;
      all[idx].failedLoginAttempts = 0;
      all[idx].status = 'ACTIVE';
      all[idx].lockoutUntil = undefined;
      all[idx].updatedAt = new Date().toISOString();
      localStorage.setItem('reconflow_auth_users', JSON.stringify(all));

      AuthService.revokeUserSessions(targetUser.id);
      refreshUsers();
      alert(`Password reset for ${targetUser.email}. User will be forced to change password on next login.`);
    }
  };

  const handleRevokeSessions = (targetUser: User) => {
    if (confirm(`Revoke all active sessions for ${targetUser.email}? User will be logged out immediately.`)) {
      AuthService.revokeUserSessions(targetUser.id);
      alert(`Active sessions revoked for ${targetUser.email}.`);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.role || '').toLowerCase().includes(query);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesQuery && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const lockedUsers = users.filter((u) => u.status === 'LOCKED').length;
  const mfaUsers = users.filter((u) => u.mfaEnabled).length;

  const loginAttempts = AuthService.getLoginAttempts();

  return (
    <div className="space-y-6">
      {/* View Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              User Administration & Access Control
            </h1>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/30">
              {userScope.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage organizational users, RBAC roles, multi-tenant scopes, password policies, and security audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create / Invite User</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Accounts"
          value={totalUsers.toString()}
          subtitle="Scoped to authorized entities"
          icon={<Users className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          title="Active Users"
          value={activeUsers.toString()}
          subtitle={`${Math.round((activeUsers / (totalUsers || 1)) * 100)}% active rate`}
          icon={<UserCheck className="w-5 h-5 text-sky-400" />}
        />
        <StatCard
          title="Locked Out Accounts"
          value={lockedUsers.toString()}
          subtitle="Failed login rate limiters"
          icon={<Lock className="w-5 h-5 text-rose-400" />}
        />
        <StatCard
          title="MFA Adoption Rate"
          value={`${mfaUsers} / ${totalUsers}`}
          subtitle="TOTP Authenticator enabled"
          icon={<ShieldCheck className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name, email, or role..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
              <option value="FINANCE_MANAGER">Finance Manager</option>
              <option value="RECONCILIATION_OFFICER">Reconciliation Officer</option>
              <option value="REGIONAL_MANAGER">Regional Manager</option>
              <option value="SHOP_MANAGER">Shop Manager</option>
              <option value="DSA">DSA / Field Agent</option>
              <option value="AUDITOR">Auditor</option>
            </select>

            {/* Status Filter */}
            <span className="text-xs text-slate-400 font-medium ml-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            User Accounts Registry ({filteredUsers.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Tenant: {userScope.tenantId}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Role & Permissions</th>
                <th className="py-3 px-4">Authorized Scope</th>
                <th className="py-3 px-4">Status & MFA</th>
                <th className="py-3 px-4">Last Login (UTC)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === userScope.userId;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center space-x-2">
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-mono">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                        {u.phone && <p className="text-[10px] text-slate-500">{u.phone}</p>}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className="inline-block bg-slate-800 text-emerald-400 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-700">
                          {u.role}
                        </span>
                        {u.mustChangePassword && (
                          <div className="text-[10px] text-amber-400 font-mono mt-1 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Temp Password Pending</span>
                          </div>
                        )}
                      </td>

                      {/* Authorized Scope */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <p className="font-semibold text-slate-200">
                            {allLegalEntities.find((e) => e.id === u.legalEntityId)?.name || u.legalEntityId}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {u.dsaId
                              ? `DSA Agent ${u.dsaId}`
                              : u.shopId
                              ? `Shop ${u.shopId}`
                              : u.regionId
                              ? `Region ${u.regionId}`
                              : 'All Regional Outlets'}
                          </p>
                        </div>
                      </td>

                      {/* Status & MFA */}
                      <td className="py-3 px-4 space-y-1">
                        <div>
                          <StatusBadge status={u.status} />
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                          <ShieldCheck className={`w-3 h-3 ${u.mfaEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span>MFA: {u.mfaEnabled ? 'Active' : 'Off'}</span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toISOString().replace('T', ' ').substring(0, 16)
                          : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2">
                        {/* Audit History */}
                        <button
                          onClick={() => {
                            setSelectedUserForHistory(u);
                            setShowLoginHistoryModal(true);
                          }}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                          title="View Security & Login Audit Trail"
                        >
                          <History className="w-4 h-4 text-sky-400" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded transition"
                          title="Reset Password & Set Temporary"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Revoke Sessions */}
                        <button
                          onClick={() => handleRevokeSessions(u)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition"
                          title="Revoke Active Sessions"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Toggle Activate / Deactivate */}
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                              u.status === 'ACTIVE'
                                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <Modal title="Create & Invite New Organization User" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateUserSubmit} className="space-y-4">
            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Samuel Kebede"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. samuel.kebede@reconflow.et"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Phone Number</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+251 9..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Organizational Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {userScope.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                  <option value="COMPANY_ADMIN">Company Admin</option>
                  <option value="FINANCE_MANAGER">Finance Manager</option>
                  <option value="RECONCILIATION_OFFICER">Reconciliation Officer</option>
                  <option value="REGIONAL_MANAGER">Regional Manager</option>
                  <option value="SHOP_MANAGER">Shop Manager</option>
                  <option value="DSA">DSA / Field Agent</option>
                  <option value="AUDITOR">Auditor</option>
                </select>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <p className="text-xs font-bold text-slate-200">Scope Assignment Boundaries</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">Legal Entity / Company</label>
                  <select
                    disabled={userScope.role === 'COMPANY_ADMIN'}
                    value={newUserLegalEntityId}
                    onChange={(e) => setNewUserLegalEntityId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {allLegalEntities.map((le) => (
                      <option key={le.id} value={le.id}>
                        {le.name} ({le.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">Region Scope (Optional)</label>
                  <select
                    value={newUserRegionId}
                    onChange={(e) => setNewUserRegionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Regions (Company-Wide)</option>
                    <option value="REG-ADD">REG-ADD (Addis Ababa Region)</option>
                    <option value="REG-ORO">REG-ORO (Oromia Region)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Temporary Password & Rules */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Initial Temporary Password</label>
                <input
                  type="text"
                  required
                  value={newUserTempPassword}
                  onChange={(e) => setNewUserTempPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="requireChange"
                  checked={requirePasswordChange}
                  onChange={(e) => setRequirePasswordChange(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-emerald-500"
                />
                <label htmlFor="requireChange" className="text-xs text-slate-300 cursor-pointer">
                  Force user to change password immediately on first login
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md"
            >
              Create Account & Send Credentials
            </button>
          </form>
        </Modal>
      )}

      {/* Modal: Login History & Audit Trail */}
      {showLoginHistoryModal && selectedUserForHistory && (
        <Modal
          title={`Security & Login Audit History: ${selectedUserForHistory.email}`}
          onClose={() => {
            setShowLoginHistoryModal(false);
            setSelectedUserForHistory(null);
          }}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
              <div>
                <p className="font-bold text-white">{selectedUserForHistory.name}</p>
                <p className="text-slate-400 font-mono text-[11px]">{selectedUserForHistory.email}</p>
              </div>
              <div className="text-right">
                <span className="bg-slate-800 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">
                  {selectedUserForHistory.role}
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Failed Attempts: {selectedUserForHistory.failedLoginAttempts}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {loginAttempts.filter((a) => (a.email || '').toLowerCase() === (selectedUserForHistory.email || '').toLowerCase()).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No login attempts recorded for this account.</p>
              ) : (
                loginAttempts
                  .filter((a) => (a.email || '').toLowerCase() === (selectedUserForHistory.email || '').toLowerCase())
                  .map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          {attempt.success ? (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                              SUCCESS
                            </span>
                          ) : (
                            <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                              FAILED ({attempt.reason || 'INVALID'})
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            IP: {attempt.ipAddress}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate max-w-xs">{attempt.userAgent}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(attempt.timestamp).toISOString().replace('T', ' ').substring(0, 16)} UTC
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
