'use client';

import React, { useEffect, useState } from 'react';
import { Topbar } from '../../../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { apiClient } from '../../../lib/api-client';
import { formatUptime } from '../../../lib/utils';
import { Cpu, HardDrive, Server, Activity, Users, Key, Rocket, Layers, RefreshCw } from 'lucide-react';

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, summaryRes] = await Promise.all([
        apiClient.get('/api/v1/admin/system-metrics'),
        apiClient.get('/api/v1/admin/summary').catch(() => null),
      ]);
      setMetrics(metricsRes.data);
      if (summaryRes?.data) {
        setSummary(summaryRes.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // 5s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="System Overview" subtitle="Real-time host compute, memory, storage, and cluster diagnostics" />

      <div className="p-8 space-y-6 max-w-7xl w-full">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Updating...'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="gap-1.5 text-xs border-slate-800 bg-slate-900/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </Button>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                CPU Compute
              </CardTitle>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Cpu className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white tracking-tight">
                {metrics ? `${metrics.cpu.usagePercent}%` : '--'}
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.cpu?.usagePercent || 0}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{metrics?.cpu?.cores || 1} Cores</span>
                <span>Load: {metrics?.cpu?.loadAvg?.['1m'] || 0.0}</span>
              </div>
            </CardContent>
          </Card>

          {/* RAM Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                RAM Memory
              </CardTitle>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Server className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white tracking-tight">
                {metrics ? `${metrics.memory.usagePercent}%` : '--'}
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.memory?.usagePercent || 0}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Used: {metrics ? `${metrics.memory.usedMB} MB` : '--'}</span>
                <span>Total: {metrics ? `${metrics.memory.totalMB} MB` : '--'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Disk Storage Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Disk Storage
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HardDrive className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white tracking-tight">
                {metrics ? `${metrics.disk.usagePercent}%` : '--'}
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.disk?.usagePercent || 0}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Free: {metrics ? `${metrics.disk.freeGB} GB` : '--'}</span>
                <span>Total: {metrics ? `${metrics.disk.totalGB} GB` : '--'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Process Uptime Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Process Uptime
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Activity className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white tracking-tight">
                {metrics ? formatUptime(metrics.uptime) : '--'}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                PID: <span className="font-mono text-slate-200">{metrics?.process?.pid || process.pid}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>RSS: {metrics ? `${metrics.process.rssMB} MB` : '--'}</span>
                <span>Heap: {metrics ? `${metrics.process.heapUsedMB} MB` : '--'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database & Application Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Registered Database Users</div>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {summary?.stats?.totalUsers ?? '--'}
              </div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Auth Sessions</div>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {summary?.stats?.activeSessions ?? '--'}
              </div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Deployments</div>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {summary?.stats?.totalDeployments ?? '--'}
              </div>
            </div>
          </Card>
        </div>

        {/* Host Details & BullMQ Queue Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" />
                Host Environment Specification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Hostname</span>
                <span className="text-slate-200">{metrics?.host?.hostname || '--'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Platform / Architecture</span>
                <span className="text-slate-200">{metrics ? `${metrics.host.platform} (${metrics.host.arch})` : '--'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Node.js Runtime</span>
                <span className="text-sky-400">{metrics?.host?.nodeVersion || '--'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">System Uptime</span>
                <span className="text-slate-200">{metrics ? formatUptime(metrics.host.uptimeSeconds) : '--'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                BullMQ Background Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Queue Name</span>
                <Badge variant="default" className="font-mono">sampleQueue</Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Active Jobs</span>
                <span className="text-emerald-400 font-bold">{summary?.queueMetrics?.active ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Completed Jobs</span>
                <span className="text-slate-200">{summary?.queueMetrics?.completed ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Failed / Delayed Jobs</span>
                <span className="text-amber-400">{summary?.queueMetrics?.failed ?? 0} / {summary?.queueMetrics?.delayed ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
