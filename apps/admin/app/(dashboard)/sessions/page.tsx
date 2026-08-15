'use client';

import React, { useEffect, useState } from 'react';
import { Topbar } from '../../../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { apiClient } from '../../../lib/api-client';
import {
  ShieldCheck,
  RefreshCw,
  Eye,
  Ban,
  Search,
  X,
  Laptop,
  Globe,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AdminSession {
  id: number | string;
  username: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  session_hash?: string;
  token?: string;
  created_at: string;
  updated_at: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [selectedSession, setSelectedSession] = useState<AdminSession | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDeactivatingId, setIsDeactivatingId] = useState<number | string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/sessions');
      setSessions(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateSession = async (session: AdminSession) => {
    if (!confirm(`Are you sure you want to deactivate session #${session.id} (${session.username})?`)) {
      return;
    }

    setIsDeactivatingId(session.id);
    setActionMessage(null);
    try {
      await apiClient.post(`/api/v1/admin/sessions/${session.id}/deactivate`);
      setActionMessage({
        type: 'success',
        text: `Session #${session.id} has been deactivated successfully.`,
      });
      fetchSessions();
      if (selectedSession?.id === session.id) {
        setSelectedSession({ ...selectedSession, is_active: false });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to deactivate session.',
      });
    } finally {
      setIsDeactivatingId(null);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user_agent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.id).includes(searchQuery);

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return s.is_active;
    if (statusFilter === 'revoked') return !s.is_active;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Admin Sessions" subtitle="Active and historical authenticated administrative sessions">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
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
              placeholder="Search by ID, username, IP, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-md text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>

          <div className="flex items-center gap-2">
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
            <span className="text-xs text-zinc-500 font-mono pl-1">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
            </span>
          </div>
        </div>

        {/* Sessions Table Card */}
        <Card className="border-zinc-800 bg-[#09090b]">
          <CardHeader className="py-3 px-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-zinc-400" />
                  Recorded Administrative Sessions
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-0.5">
                  Inspect session telemetry or revoke active tokens
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSessions.length === 0 && !isLoading ? (
              <div className="p-10 text-center text-zinc-500 text-xs font-mono">
                No matching administrative sessions found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Session ID</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Admin User</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">IP Address</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Client / Browser</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Status</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Created At</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="py-2.5 font-mono text-xs font-semibold text-zinc-200">
                        #{session.id}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[10px]">
                            {session.username?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <span className="text-xs font-medium text-zinc-200">{session.username || 'admin'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 font-mono text-xs text-zinc-300">
                        {session.ip_address || '127.0.0.1'}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-zinc-400 max-w-xs truncate font-mono">
                        {session.user_agent || 'Unknown Client'}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {session.is_active ? (
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
                        {new Date(session.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSession(session)}
                            className="h-7 px-2.5 text-xs gap-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                          >
                            <Eye className="size-3.5 text-zinc-400" />
                            <span>Details</span>
                          </Button>

                          {session.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isDeactivatingId === session.id}
                              onClick={() => handleDeactivateSession(session)}
                              className="h-7 px-2.5 text-xs gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Ban className="size-3.5" />
                              <span>{isDeactivatingId === session.id ? 'Revoking...' : 'Revoke'}</span>
                            </Button>
                          )}
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

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Session #{selectedSession.id} Telemetry
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
                <span className="text-zinc-400 flex items-center gap-2">
                  <User className="size-3.5 text-zinc-500" /> Authenticated User
                </span>
                <span className="text-zinc-100 font-semibold">{selectedSession.username}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Globe className="size-3.5 text-zinc-500" /> IP Address
                </span>
                <span className="text-zinc-200">{selectedSession.ip_address}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
                <span className="text-zinc-400 flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-zinc-500" /> Lifecycle Status
                </span>
                {selectedSession.is_active ? (
                  <Badge variant="outline" className="text-xs py-0.5 px-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs py-0.5 px-2 bg-zinc-800 text-zinc-400 border-zinc-700">
                    Revoked / Inactive
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Clock className="size-3.5 text-zinc-500" /> Established At
                </span>
                <span className="text-zinc-300">{new Date(selectedSession.created_at).toLocaleString()}</span>
              </div>

              <div className="py-2 border-b border-zinc-800/80">
                <span className="text-zinc-400 flex items-center gap-2 mb-1.5">
                  <Laptop className="size-3.5 text-zinc-500" /> User Agent
                </span>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 break-all text-[11px] leading-relaxed">
                  {selectedSession.user_agent || 'Unknown'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
              {selectedSession.is_active ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeactivatingId === selectedSession.id}
                  onClick={() => handleDeactivateSession(selectedSession)}
                  className="h-8 text-xs gap-1.5 font-medium"
                >
                  <Ban className="size-3.5" />
                  <span>{isDeactivatingId === selectedSession.id ? 'Deactivating...' : 'Deactivate Session'}</span>
                </Button>
              ) : (
                <span className="text-xs text-zinc-500 font-mono">Session is already inactive</span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSession(null)}
                className="h-8 text-xs border-zinc-700 hover:bg-zinc-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
