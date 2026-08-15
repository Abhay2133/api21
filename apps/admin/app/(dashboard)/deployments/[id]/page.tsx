'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Topbar } from '../../../../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { apiClient } from '../../../../lib/api-client';
import { ArrowLeft, RefreshCw, Copy, Check, Search, FileText, Terminal } from 'lucide-react';

export default function DeploymentLogsPage() {
  const params = useParams();
  const deploymentId = params?.id as string;

  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    if (!deploymentId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/admin/deployments/${deploymentId}/logs`);
      setLogs(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch deployment logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [deploymentId]);

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyAll = () => {
    const fullText = logs.map((l) => `[${new Date(l.created_at).toISOString()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title={`Deployment: ${deploymentId}`} subtitle="Step-by-step pipeline execution logs" />

      <div className="p-8 space-y-6 max-w-7xl w-full">
        {/* Navigation & Actions Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/deployments">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-800 bg-slate-900/60">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Deployments
              </Button>
            </Link>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              {deploymentId}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              disabled={logs.length === 0}
              className="h-8 gap-1.5 text-xs border-slate-800 bg-slate-900/60"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy All'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs border-slate-800 bg-slate-900/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Log Viewer Card */}
        <Card className="border-slate-800 bg-slate-950/80">
          <CardHeader className="pb-4 border-b border-slate-800/80 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                Execution Log Output ({filteredLogs.length} entries)
              </CardTitle>
              <CardDescription className="text-xs">Recorded during zero-downtime deployment runner steps</CardDescription>
            </div>

            <div className="w-64 relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Filter logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-900 border-slate-800"
              />
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono">
                {isLoading ? 'Loading logs...' : 'No logs found matching filter.'}
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-xs max-h-[600px] overflow-y-auto pr-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-slate-900/70 border border-slate-800/60 flex items-start gap-3 hover:border-slate-700 transition-colors"
                  >
                    <span className="text-[11px] text-slate-500 flex-shrink-0 select-none">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    <span className="text-slate-300 break-all leading-relaxed">
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
