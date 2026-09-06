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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#09090b] relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="size-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 font-bold text-lg mb-3 shadow-lg">
            21
          </div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">apps21 Admin Portal</h2>
          <p className="text-xs text-zinc-400 mt-1">Authenticate with system master credentials</p>
        </div>

        <Card className="border-zinc-800 bg-[#09090b] shadow-2xl">
          <CardHeader className="space-y-1 pb-4 border-b border-zinc-800">
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Shield className="size-4 text-zinc-400" />
              Administrative Login
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Access restricted to authorized maintainers only.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <User className="size-3.5 text-zinc-500" />
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
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Lock className="size-3.5 text-zinc-500" />
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
              <Button type="submit" className="w-full gap-2 font-medium" disabled={isLoading}>
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Control Panel</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
