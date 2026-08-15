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
        return <Badge variant="outline" className="text-xs font-mono py-0 px-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-xs font-mono py-0 px-2 bg-red-500/10 text-red-400 border-red-500/20">Failed</Badge>;
      case 'pending':
      case 'cloning':
      case 'building':
      case 'health_checking':
        return <Badge variant="outline" className="text-xs font-mono py-0 px-2 bg-amber-500/10 text-amber-400 border-amber-500/20">{status.replace('_', ' ')}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs font-mono py-0 px-2 bg-zinc-800 text-zinc-300 border-zinc-700">{status || 'Unknown'}</Badge>;
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
          className="h-8 text-xs gap-1.5 px-3 border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:text-white hover:bg-zinc-800 font-medium"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
        <Button
          size="sm"
          onClick={handleTriggerDeploy}
          disabled={isTriggering}
          className="h-8 text-xs gap-1.5 px-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold"
        >
          <Play className="size-3 fill-current" />
          <span>{isTriggering ? 'Deploying...' : 'New Deploy'}</span>
        </Button>
      </Topbar>

      <div className="p-5 space-y-4 max-w-7xl w-full">
        {message && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <AlertCircle className="size-4 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Deployments Table Card */}
        <Card className="border-zinc-800 bg-[#09090b]">
          <CardHeader className="py-3 px-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Rocket className="size-4 text-zinc-400" />
                  Deployment History
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-0.5">
                  Click log inspector to view execution logs
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-zinc-500">{deployments.length} records</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {deployments.length === 0 && !isLoading ? (
              <div className="p-10 text-center text-zinc-500 text-xs font-mono">
                No deployment records found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Deployment ID</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Status</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Triggered At</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium">Updated At</TableHead>
                    <TableHead className="h-9 text-xs text-zinc-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((dep) => (
                    <TableRow key={dep.id} className="border-zinc-800/60 hover:bg-zinc-900/40">
                      <TableCell className="py-2.5 font-mono text-xs font-semibold text-zinc-200">
                        {dep.id}
                      </TableCell>
                      <TableCell className="py-2.5">{getStatusBadge(dep.status)}</TableCell>
                      <TableCell className="py-2.5 text-xs text-zinc-400 font-mono">
                        {new Date(dep.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-zinc-400 font-mono">
                        {new Date(dep.updated_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <Link href={`/deployments/${dep.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                            <Eye className="size-3.5 text-zinc-400" />
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
