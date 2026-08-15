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
          className="h-7 text-[11px] gap-1 px-2 border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </Topbar>

      <div className="p-4 space-y-3.5 max-w-7xl w-full">
        {/* Status Line */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : 'syncing...'}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Host: <span className="text-slate-200">{metrics?.host?.hostname || 'localhost'}</span>
          </div>
        </div>

        {/* 1. Primary Resource Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* CPU Card */}
          <Card className="p-3.5 border-slate-800/80 bg-[#0c121d] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                CPU
              </span>
              <span className="text-[10px] font-mono text-slate-400">{metrics?.cpu?.cores || 1} Cores</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {metrics ? `${metrics.cpu.usagePercent}%` : '--'}
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.cpu?.usagePercent || 0}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between">
              <span>Load (1m)</span>
              <span className="text-slate-300">{metrics?.cpu?.loadAvg?.['1m'] || '0.00'}</span>
            </div>
          </Card>

          {/* RAM Card */}
          <Card className="p-3.5 border-slate-800/80 bg-[#0c121d] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Memory
              </span>
              <span className="text-[10px] font-mono text-slate-400">{metrics ? `${metrics.memory.totalMB} MB` : '--'}</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {metrics ? `${metrics.memory.usagePercent}%` : '--'}
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.memory?.usagePercent || 0}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between">
              <span>Used</span>
              <span className="text-slate-300">{metrics ? `${metrics.memory.usedMB} MB` : '--'}</span>
            </div>
          </Card>

          {/* Disk Card */}
          <Card className="p-3.5 border-slate-800/80 bg-[#0c121d] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                Disk
              </span>
              <span className="text-[10px] font-mono text-slate-400">{metrics ? `${metrics.disk.totalGB} GB` : '--'}</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {metrics ? `${metrics.disk.usagePercent}%` : '--'}
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.disk?.usagePercent || 0}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between">
              <span>Free</span>
              <span className="text-slate-300">{metrics ? `${metrics.disk.freeGB} GB` : '--'}</span>
            </div>
          </Card>

          {/* Process Card */}
          <Card className="p-3.5 border-slate-800/80 bg-[#0c121d] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Process Uptime
              </span>
              <span className="text-[10px] font-mono text-slate-400">PID {metrics?.process?.pid || process.pid}</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {metrics ? formatUptime(metrics.uptime) : '--'}
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between pt-1 border-t border-slate-800/60">
              <span>Heap / RSS</span>
              <span className="text-slate-300">{metrics ? `${metrics.process.heapUsedMB} / ${metrics.process.rssMB} MB` : '--'}</span>
            </div>
          </Card>
        </div>

        {/* 2. Application Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 border-slate-800/80 bg-[#0c121d] flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400 font-medium truncate">Database Users</div>
              <div className="text-base font-bold text-white font-mono leading-tight">{summary?.stats?.totalUsers ?? '--'}</div>
            </div>
          </Card>

          <Card className="p-3 border-slate-800/80 bg-[#0c121d] flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400 font-medium truncate">Active Sessions</div>
              <div className="text-base font-bold text-white font-mono leading-tight">{summary?.stats?.activeSessions ?? '--'}</div>
            </div>
          </Card>

          <Card className="p-3 border-slate-800/80 bg-[#0c121d] flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400 font-medium truncate">Deployments</div>
              <div className="text-base font-bold text-white font-mono leading-tight">{summary?.stats?.totalDeployments ?? '--'}</div>
            </div>
          </Card>
        </div>

        {/* 3. Host Details & Queue Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="border-slate-800/80 bg-[#0c121d]">
            <CardHeader className="py-2.5 px-3.5 border-b border-slate-800/80">
              <CardTitle className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                Host Specification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Hostname</span>
                <span className="text-slate-200">{metrics?.host?.hostname || '--'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Platform / Arch</span>
                <span className="text-slate-200">{metrics ? `${metrics.host.platform} (${metrics.host.arch})` : '--'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Node Runtime</span>
                <span className="text-sky-400">{metrics?.host?.nodeVersion || '--'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">System Uptime</span>
                <span className="text-slate-200">{metrics ? formatUptime(metrics.host.uptimeSeconds) : '--'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-[#0c121d]">
            <CardHeader className="py-2.5 px-3.5 border-b border-slate-800/80">
              <CardTitle className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                BullMQ Queue Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Default Queue</span>
                <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">sampleQueue</Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Active Jobs</span>
                <span className="text-emerald-400 font-semibold">{summary?.queueMetrics?.active ?? 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Completed Jobs</span>
                <span className="text-slate-200">{summary?.queueMetrics?.completed ?? 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Failed / Delayed</span>
                <span className="text-amber-400">{summary?.queueMetrics?.failed ?? 0} / {summary?.queueMetrics?.delayed ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
