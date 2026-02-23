'use client';

import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/toast';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('ChangeMe123!');

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      window.localStorage.setItem('parking_auth_token', data.accessToken);
      pushToast('Login successful', 'success');
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      pushToast(error.message, 'error');
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-mesh" />
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md space-y-5 rounded-2xl border border-slate-700/70 bg-slate-900/80 p-7 shadow-soft backdrop-blur"
      >
        <div>
          <h1 className="text-3xl font-semibold">ParkIQ Access</h1>
          <p className="text-sm text-slate-300">
            Sign in with your operator credentials.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-200">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-200">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </motion.form>
    </div>
  );
}
