'use client';

import React, { useEffect, useState } from 'react';
import { Topbar } from '../../../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../../components/ui/alert-dialog';
import { apiClient } from '../../../lib/api-client';
import { AdminUser, CreateAdminUserDto, UpdateAdminUserDto } from '@api21/types';
import {
  UserCog,
  UserPlus,
  RefreshCw,
  Search,
  X,
  Edit2,
  KeyRound,
  Trash2,
  Ban,
  CheckCircle2,
  AlertCircle,
  Shield,
  Mail,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'admin' | 'operator'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminUserDto>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'admin',
    is_active: true,
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<UpdateAdminUserDto>({
    name: '',
    email: '',
    role: 'admin',
    is_active: true,
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/users');
      setUsers(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username || !createForm.password) {
      setActionMessage({ type: 'error', text: 'Username and password are required.' });
      return;
    }
    if (createForm.password.length < 6) {
      setActionMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsSubmittingCreate(true);
    setActionMessage(null);
    try {
      await apiClient.post('/api/v1/admin/users', createForm);
      setActionMessage({
        type: 'success',
        text: `Admin user '${createForm.username}' created successfully.`,
      });
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'admin',
        is_active: true,
      });
      fetchUsers();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to create admin user.',
      });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role,
      is_active: user.is_active,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);
    setActionMessage(null);
    try {
      await apiClient.put(`/api/v1/admin/users/${editingUser.id}`, editForm);
      setActionMessage({
        type: 'success',
        text: `Admin user '${editingUser.username}' updated successfully.`,
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to update admin user.',
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (!newPassword || newPassword.length < 6) {
      setActionMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setActionMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSubmittingReset(true);
    setActionMessage(null);
    try {
      await apiClient.post(`/api/v1/admin/users/${resettingUser.id}/reset-password`, {
        password: newPassword,
      });
      setActionMessage({
        type: 'success',
        text: `Password for '${resettingUser.username}' has been reset successfully.`,
      });
      setResettingUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to reset password.',
      });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await apiClient.post(`/api/v1/admin/users/${user.id}/toggle-status`);
      setActionMessage({
        type: 'success',
        text: `Admin user '${user.username}' is now ${user.is_active ? 'revoked' : 'active'}.`,
      });
      fetchUsers();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to update user status.',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setIsSubmittingDelete(true);
    setActionMessage(null);
    try {
      await apiClient.delete(`/api/v1/admin/users/${deletingUser.id}`);
      setActionMessage({
        type: 'success',
        text: `Admin user '${deletingUser.username}' was deleted.`,
      });
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to delete user.',
      });
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).includes(searchQuery);

    if (!matchesSearch) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.is_active) return false;
    if (statusFilter === 'revoked' && u.is_active) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Admin Users" subtitle="Manage authorized administrator accounts, roles, and credentials">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="h-8 text-xs gap-1.5 px-3 bg-zinc-100 text-zinc-950 hover:bg-white font-medium shadow-sm cursor-pointer"
        >
          <UserPlus className="size-3.5" />
          <span>Add Admin User</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={isLoading}
          className="h-8 text-xs gap-1.5 px-3 border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:text-white hover:bg-zinc-800 font-medium"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </Topbar>

      <div className="p-5 space-y-4 max-w-7xl w-full">
        {actionMessage && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="size-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="size-4 flex-shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-zinc-400 hover:text-zinc-200">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by username, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-md text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
              {(['all', 'active', 'revoked'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${
                    statusFilter === filter
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Role Filter */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
              {(['all', 'superadmin', 'admin', 'operator'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors ${
                    roleFilter === role
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <span className="text-xs text-zinc-500 font-mono pl-1">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </span>
          </div>
        </div>

        {/* Users Table Card */}
        <Card className="border-zinc-800 bg-[#09090b]">
          <CardHeader className="py-3 px-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <UserCog className="size-4 text-zinc-400" />
                  Administrator Accounts
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-0.5">
                  Database administrators with access privileges (Environment master credentials remain active as root fallback)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredUsers.length === 0 && !isLoading ? (
              <div className="p-10 text-center text-zinc-500 text-xs font-mono">
                No admin users found matching current filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">ADMIN USER</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">EMAIL</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">ROLE</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">STATUS</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">LAST LOGIN</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">CREATED AT</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center font-bold text-xs">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-zinc-200">{u.username}</span>
                            {u.name && <span className="text-[11px] text-zinc-400">{u.name}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-zinc-300 font-mono">
                        {u.email || '-'}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-mono py-0 px-2 uppercase ${
                            u.role === 'superadmin'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : u.role === 'operator'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        {u.is_active ? (
                          <Badge variant="outline" className="text-xs font-mono py-0 px-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-mono py-0 px-2 bg-zinc-800 text-zinc-400 border-zinc-700">
                            Revoked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-zinc-400 font-mono">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-zinc-400 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            title="Edit User"
                            onClick={() => openEditModal(u)}
                            className="h-7 px-2 text-xs gap-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                          >
                            <Edit2 className="size-3" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            title="Reset Password"
                            onClick={() => setResettingUser(u)}
                            className="h-7 px-2 text-xs gap-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                          >
                            <KeyRound className="size-3 text-zinc-400" />
                            <span>Password</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            title={u.is_active ? 'Revoke User' : 'Activate User'}
                            onClick={() => handleToggleStatus(u)}
                            className={`h-7 px-2 text-xs gap-1 ${
                              u.is_active
                                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            <Ban className="size-3" />
                            <span>{u.is_active ? 'Revoke' : 'Activate'}</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            title="Delete User"
                            onClick={() => setDeletingUser(u)}
                            className="h-7 px-2 text-xs gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 1. Create Admin User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">Add New Admin User</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="p-5 space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                    <UserCog className="size-3.5 text-zinc-500" /> Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. devops_lead"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-zinc-500" /> Master Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-zinc-500" /> Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Alex Taylor"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                      <Shield className="size-3.5 text-zinc-500" /> Role
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                      <option value="operator">Operator</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                    <Mail className="size-3.5 text-zinc-500" /> Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="alex@api21.dev"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="h-8 text-xs border-zinc-700 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingCreate}
                  className="h-8 text-xs bg-zinc-100 text-zinc-950 hover:bg-white font-medium"
                >
                  {isSubmittingCreate ? 'Creating...' : 'Create Admin User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Admin User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit2 className="size-4 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">Edit Admin User: {editingUser.username}</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-300">Display Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-zinc-300">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                      <option value="operator">Operator</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-300">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_active_edit"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 size-4 text-emerald-500"
                  />
                  <label htmlFor="is_active_edit" className="text-xs text-zinc-300 cursor-pointer">
                    Account is active and permitted to login
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="h-8 text-xs border-zinc-700 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingEdit}
                  className="h-8 text-xs bg-zinc-100 text-zinc-950 hover:bg-white font-medium"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">Reset Password: {resettingUser.username}</h3>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="p-5 space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-300">New Master Password</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-300">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResettingUser(null)}
                  className="h-8 text-xs border-zinc-700 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingReset}
                  className="h-8 text-xs bg-zinc-100 text-zinc-950 hover:bg-white font-medium"
                >
                  {isSubmittingReset ? 'Updating...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent className="border-zinc-800 bg-[#09090b] shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                <AlertTriangle className="size-4.5" />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-sm font-semibold text-zinc-100">
                  Delete Admin Account: {deletingUser?.username}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-zinc-400 mt-1">
                  Are you sure you want to permanently delete this administrator? This action cannot be undone.
                  (Note: Environmental master credentials will continue to function as root fallback).
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isSubmittingDelete} className="h-8 text-xs font-medium border-zinc-800 hover:bg-zinc-800 text-zinc-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmittingDelete}
              className="h-8 text-xs font-medium bg-red-600 hover:bg-red-500 text-white"
            >
              {isSubmittingDelete ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
