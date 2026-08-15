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
        text: `Redeployment initiated with ID: ${res.data?.deployment_id || (res as any).deployment_id || 'deploy_task'}`,
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
        return <Badge variant="success" className="text-[10px] py-0 px-1.5 font-mono">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-mono">Failed</Badge>;
      case 'pending':
      case 'cloning':
      case 'building':
      case 'health_checking':
        return <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-mono">{status.replace('_', ' ')}</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Deployments" subtitle="Zero-downtime pipeline history">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDeployments}
          disabled={isLoading}
          className="h-7 text-[11px] gap-1 px-2 border-slate-800 bg-slate-900/60 text-slate-300"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
        <Button
          size="sm"
          onClick={handleTriggerDeploy}
          disabled={isTriggering}
          className="h-7 text-[11px] gap-1 px-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isTriggering ? 'Deploying...' : 'New Deploy'}</span>
        </Button>
      </Topbar>

      <div className="p-4 space-y-3 max-w-7xl w-full">
        {message && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Deployments Table Card */}
        <Card className="border-slate-800/80 bg-slate-950/60">
          <CardHeader className="py-2.5 px-4 border-b border-slate-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-sky-400" />
                  Deployment History
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                  Click log inspector to view execution logs
                </CardDescription>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{deployments.length} records</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {deployments.length === 0 && !isLoading ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No deployment records found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800/80 hover:bg-transparent">
                    <TableHead className="h-8 text-[11px] text-slate-400 font-medium">Deployment ID</TableHead>
                    <TableHead className="h-8 text-[11px] text-slate-400 font-medium">Status</TableHead>
                    <TableHead className="h-8 text-[11px] text-slate-400 font-medium">Triggered At</TableHead>
                    <TableHead className="h-8 text-[11px] text-slate-400 font-medium">Updated At</TableHead>
                    <TableHead className="h-8 text-[11px] text-slate-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((dep) => (
                    <TableRow key={dep.id} className="border-slate-800/60 hover:bg-slate-900/40">
                      <TableCell className="py-2 font-mono text-[11px] font-semibold text-sky-400">
                        {dep.id}
                      </TableCell>
                      <TableCell className="py-2">{getStatusBadge(dep.status)}</TableCell>
                      <TableCell className="py-2 text-[11px] text-slate-400 font-mono">
                        {new Date(dep.created_at).toLocaleTimeString()} · {new Date(dep.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2 text-[11px] text-slate-400 font-mono">
                        {new Date(dep.updated_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Link href={`/deployments/${dep.id}`}>
                          <Button variant="outline" size="sm" className="h-6 px-2 text-[11px] gap-1 border-slate-700 hover:border-slate-600">
                            <Eye className="w-3 h-3 text-slate-400" />
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
