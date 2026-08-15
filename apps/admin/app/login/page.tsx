'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../lib/api-client';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, checkAuth } = useAuthStore();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth().then((authed) => {
      if (authed) {
        router.replace('/overview');
      }
    });
  }, [checkAuth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/api/v1/admin/login', { username, password });
      const user = res.data?.user || { username };

      setAuth(user);
      router.push('/overview');
    } catch (err: any) {
      setError(err.message || 'Invalid username or master credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-sky-500/20 text-slate-950 font-black text-2xl mb-3">
            21
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">api21 Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Authenticate with system master credentials</p>
        </div>

        <Card className="border-slate-800/80 bg-slate-950/70 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              Administrative Login
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Access restricted to authorized maintainers only.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Control Plane</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-[11px] text-slate-600 font-mono">
          Protected with pure cookie authentication & double-submit CSRF hardening
        </div>
      </div>
    </div>
  );
}
