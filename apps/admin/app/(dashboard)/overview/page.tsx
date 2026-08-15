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
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Overview" subtitle="System telemetry & metrics">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="h-8 text-xs gap-1.5 px-3 border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:text-white hover:bg-zinc-800 font-medium"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </Topbar>

      <div className="p-5 space-y-4 max-w-7xl w-full">
        {/* Status Line */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : 'syncing...'}</span>
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            Host: <span className="text-zinc-200 font-medium">{metrics?.host?.hostname || 'localhost'}</span>
          </div>
        </div>

        {/* 1. Primary Resource Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* CPU Card */}
          <Card className="p-4 border-zinc-800 bg-[#09090b]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Cpu className="size-4 text-zinc-400" />
                CPU Compute
              </span>
              <span className="text-xs font-mono text-zinc-500">{metrics?.cpu?.cores || 1} Cores</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">
              {metrics ? `${metrics.cpu.usagePercent}%` : '--'}
            </div>
            <div className="mt-2.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-zinc-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.cpu?.usagePercent || 0}%` }}
              />
            </div>
            <div className="mt-2.5 text-xs text-zinc-400 font-mono flex justify-between">
              <span>Load (1m)</span>
              <span className="text-zinc-200">{metrics?.cpu?.loadAvg?.['1m'] || '0.00'}</span>
            </div>
          </Card>

          {/* RAM Card */}
          <Card className="p-4 border-zinc-800 bg-[#09090b]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Server className="size-4 text-zinc-400" />
                Memory
              </span>
              <span className="text-xs font-mono text-zinc-500">{metrics ? `${metrics.memory.totalMB} MB` : '--'}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">
              {metrics ? `${metrics.memory.usagePercent}%` : '--'}
            </div>
            <div className="mt-2.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-zinc-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.memory?.usagePercent || 0}%` }}
              />
            </div>
            <div className="mt-2.5 text-xs text-zinc-400 font-mono flex justify-between">
              <span>Used</span>
              <span className="text-zinc-200">{metrics ? `${metrics.memory.usedMB} MB` : '--'}</span>
            </div>
          </Card>

          {/* Disk Card */}
          <Card className="p-4 border-zinc-800 bg-[#09090b]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <HardDrive className="size-4 text-zinc-400" />
                Disk Storage
              </span>
              <span className="text-xs font-mono text-zinc-500">{metrics ? `${metrics.disk.totalGB} GB` : '--'}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">
              {metrics ? `${metrics.disk.usagePercent}%` : '--'}
            </div>
            <div className="mt-2.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-zinc-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.disk?.usagePercent || 0}%` }}
              />
            </div>
            <div className="mt-2.5 text-xs text-zinc-400 font-mono flex justify-between">
              <span>Free</span>
              <span className="text-zinc-200">{metrics ? `${metrics.disk.freeGB} GB` : '--'}</span>
            </div>
          </Card>

          {/* Process Card */}
          <Card className="p-4 border-zinc-800 bg-[#09090b]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Activity className="size-4 text-zinc-400" />
                Uptime
              </span>
              <span className="text-xs font-mono text-zinc-500">PID {metrics?.process?.pid || process.pid}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">
              {metrics ? formatUptime(metrics.uptime) : '--'}
            </div>
            <div className="mt-2.5 text-xs text-zinc-400 font-mono flex justify-between pt-1.5 border-t border-zinc-800">
              <span>Heap / RSS</span>
              <span className="text-zinc-200">{metrics ? `${metrics.process.heapUsedMB} / ${metrics.process.rssMB} MB` : '--'}</span>
            </div>
          </Card>
        </div>

        {/* 2. Application Summary Cards */}
        <div className="grid grid-cols-3 gap-3.5">
          <Card className="p-3.5 border-zinc-800 bg-[#09090b] flex items-center gap-3.5">
            <div className="size-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
              <Users className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-zinc-400 font-medium truncate">Database Users</div>
              <div className="text-lg font-bold text-zinc-100 font-mono leading-tight mt-0.5">{summary?.stats?.totalUsers ?? '--'}</div>
            </div>
          </Card>

          <Card className="p-3.5 border-zinc-800 bg-[#09090b] flex items-center gap-3.5">
            <div className="size-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
              <Key className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-zinc-400 font-medium truncate">Active Sessions</div>
              <div className="text-lg font-bold text-zinc-100 font-mono leading-tight mt-0.5">{summary?.stats?.activeSessions ?? '--'}</div>
            </div>
          </Card>

          <Card className="p-3.5 border-zinc-800 bg-[#09090b] flex items-center gap-3.5">
            <div className="size-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
              <Rocket className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-zinc-400 font-medium truncate">Deployments</div>
              <div className="text-lg font-bold text-zinc-100 font-mono leading-tight mt-0.5">{summary?.stats?.totalDeployments ?? '--'}</div>
            </div>
          </Card>
        </div>

        {/* 3. Host Details & Queue Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <Card className="border-zinc-800 bg-[#09090b]">
            <CardHeader className="py-3 px-4 border-b border-zinc-800">
              <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Server className="size-4 text-zinc-400" />
                Host Specification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-400">Hostname</span>
                <span className="text-zinc-200">{metrics?.host?.hostname || '--'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-400">Platform / Arch</span>
                <span className="text-zinc-200">{metrics ? `${metrics.host.platform} (${metrics.host.arch})` : '--'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-400">Node Runtime</span>
                <span className="text-zinc-200">{metrics?.host?.nodeVersion || '--'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">System Uptime</span>
                <span className="text-zinc-200">{metrics ? formatUptime(metrics.host.uptimeSeconds) : '--'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-[#09090b]">
            <CardHeader className="py-3 px-4 border-b border-zinc-800">
              <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Layers className="size-4 text-zinc-400" />
                BullMQ Queue Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-400">Default Queue</span>
                <Badge variant="outline" className="text-xs font-mono py-0.5 px-2 bg-zinc-900 border-zinc-800 text-zinc-300">sampleQueue</Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-400">Active Jobs</span>
                <span className="text-emerald-400 font-semibold">{summary?.queueMetrics?.active ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                <span className="text-zinc-400">Completed Jobs</span>
                <span className="text-zinc-200">{summary?.queueMetrics?.completed ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">Failed / Delayed</span>
                <span className="text-amber-400">{summary?.queueMetrics?.failed ?? 0} / {summary?.queueMetrics?.delayed ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
