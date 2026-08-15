'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topbar } from '../../../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { apiClient } from '../../../lib/api-client';
import { Rocket, RefreshCw, Eye, Play, AlertCircle } from 'lucide-react';

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDeployments = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/deployments');
      setDeployments(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerDeploy = async () => {
    if (!confirm('Are you sure you want to trigger a zero-downtime redeployment?')) return;
    setIsTriggering(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/api/v1/webhooks/deploy');
      setMessage({
        type: 'success',
        text: `Redeployment initiated with ID: ${res.deployment_id}`,
      });
      fetchDeployments();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to trigger deployment.',
      });
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
      case 'cloning':
      case 'building':
      case 'health_checking':
        return <Badge variant="warning">{status.replace('_', ' ')}</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Deployments" subtitle="Zero-downtime deployment history and execution log inspector" />

      <div className="p-8 space-y-6 max-w-7xl w-full">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Rocket className="w-5 h-5 text-sky-400" />
              Deployment Pipeline Records
            </h2>
            <p className="text-xs text-slate-400">All deployment jobs executed via start.js or CI webhooks</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeployments}
              disabled={isLoading}
              className="gap-1.5 text-xs border-slate-800 bg-slate-900/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={handleTriggerDeploy}
              disabled={isTriggering}
              className="gap-1.5 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isTriggering ? 'Triggering...' : 'Trigger Deployment'}
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Deployments Table Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Historical Deployments</CardTitle>
            <CardDescription className="text-xs">Click any deployment row to inspect its detailed logs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {deployments.length === 0 && !isLoading ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No deployment records found in database.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deployment ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered At</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((dep) => (
                    <TableRow key={dep.id} className="hover:bg-slate-900/50">
                      <TableCell className="font-mono text-xs font-semibold text-sky-400">
                        {dep.id}
                      </TableCell>
                      <TableCell>{getStatusBadge(dep.status)}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {new Date(dep.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {new Date(dep.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/deployments/${dep.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1 border-slate-700">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Logs</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
