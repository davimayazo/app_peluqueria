"use client";

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginUser, fetchProfile } from '@/lib/api';
import { useAuth } from '@/store/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

const loginSchema = z.object({
  username: z.string().min(1, 'El correo o usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParams = searchParams.get('redirect');

  const { login } = useAuth();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    try {
      // 1. Authenticate and get tokens
      const tokenData = await loginUser(data);

      // Temporarily store in zustand without user data to allow fetchProfile to work
      useAuth.getState().login(tokenData.access, tokenData.refresh, null as any);

      // 2. Fetch user profile data
      const userData = await fetchProfile();

      // 3. Finalize login store
      login(tokenData.access, tokenData.refresh, userData);

      // 4. Redirect
      if (redirectParams) {
        router.push(redirectParams);
      } else if (userData.profile?.role === 'admin' || userData.profile?.role === 'barbero') {
        router.push('/admin/dashboard');
      } else {
        router.push('/cliente/dashboard');
      }

    } catch (err: any) {
      // Revert temporary state if failed
      useAuth.getState().logout();
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <Card className="w-full max-w-md relative z-10 border-border/50">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl">Bienvenido</CardTitle>
        <CardDescription>Inicia sesión para gestionar tus citas.</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textMuted">Correo</label>
            <Input
              type="text"
              {...register('username')}
              placeholder="ejemplo@correo.com"
              className={errors.username ? "border-red-500" : ""}
            />
            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-textMuted">Contraseña</label>
            <Input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full shadow-glow"
            >
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <div className="text-sm text-textMuted">
          ¿No tienes cuenta? <Link href="/registro" className="text-primary hover:text-primaryHover hover:underline transition-colors">Regístrate aquí</Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full z-0 pointer-events-none" />

      <Suspense fallback={<div className="z-10 text-white">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
