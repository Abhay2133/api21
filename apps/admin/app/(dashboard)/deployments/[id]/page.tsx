'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Topbar } from '../../../../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
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
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title={`Deployment: ${deploymentId}`} subtitle="Step-by-step pipeline execution logs">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          disabled={logs.length === 0}
          className="h-8 text-xs gap-1.5 px-3 border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:text-white hover:bg-zinc-800 font-medium"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-zinc-400" />}
          <span>{copied ? 'Copied' : 'Copy All'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={isLoading}
          className="h-8 text-xs gap-1.5 px-3 border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:text-white hover:bg-zinc-800 font-medium"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </Topbar>

      <div className="p-5 space-y-4 max-w-7xl w-full">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/deployments">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:text-white hover:bg-zinc-800">
                <ArrowLeft className="size-3.5 text-zinc-400" />
                <span>Back to Deployments</span>
              </Button>
            </Link>
            <h2 className="text-sm font-semibold text-zinc-100 font-mono flex items-center gap-2">
              <Terminal className="size-4 text-zinc-400" />
              {deploymentId}
            </h2>
          </div>
        </div>

        {/* Log Viewer Card */}
        <Card className="border-zinc-800 bg-[#09090b]">
          <CardHeader className="py-3 px-4 border-b border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FileText className="size-4 text-zinc-400" />
                Execution Log Output ({filteredLogs.length} entries)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">Recorded during zero-downtime deployment runner steps</CardDescription>
            </div>

            <div className="w-64 relative">
              <Search className="size-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-md text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              />
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {filteredLogs.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 text-xs font-mono">
                {isLoading ? 'Loading logs...' : 'No logs found matching filter.'}
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-xs max-h-[600px] overflow-y-auto pr-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <span className="text-[11px] text-zinc-500 flex-shrink-0 select-none">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    <span className="text-zinc-300 break-all leading-relaxed">
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
