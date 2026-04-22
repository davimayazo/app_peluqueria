"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registerUser } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

const registerSchema = z.object({
  first_name: z.string().min(2, 'El nombre es obligatorio'),
  last_name: z.string().min(2, 'Los apellidos son obligatorios'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Dirección de correo inválida'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  password_confirm: z.string()
}).refine((data) => data.password === data.password_confirm, {
  message: "Las contraseñas no coinciden",
  path: ["password_confirm"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError('');
    try {
      const { password_confirm, ...registerData } = data;
      await registerUser({ ...registerData, password2: data.password });
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Error al completar el registro');
    }
  };

  return (
    <div className="min-h-screen py-12 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full z-0 pointer-events-none" />
      
      <Card className="w-full max-w-lg relative z-10 border-border/50">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl">Crea tu Cuenta</CardTitle>
          <CardDescription>Únete a BarberBook y comienza a reservar.</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-textMuted">Nombre</label>
                <Input 
                  {...register('first_name')}
                  placeholder="Juan" 
                  className={errors.first_name ? "border-red-500" : ""}
                />
                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-textMuted">Apellidos</label>
                <Input 
                  {...register('last_name')}
                  placeholder="Pérez" 
                  className={errors.last_name ? "border-red-500" : ""}
                />
                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-textMuted">Usuario</label>
              <Input 
                {...register('username')}
                placeholder="juanpy88" 
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-textMuted">Correo Electrónico</label>
              <Input 
                type="email"
                {...register('email')}
                placeholder="juan@ejemplo.com" 
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-textMuted">Teléfono (opcional)</label>
              <Input 
                type="tel"
                {...register('phone')}
                placeholder="+34 600 000 000" 
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-textMuted">Confirmar Contraseña</label>
                <Input 
                  type="password" 
                  {...register('password_confirm')}
                  placeholder="••••••••" 
                  className={errors.password_confirm ? "border-red-500" : ""}
                />
                {errors.password_confirm && <p className="text-xs text-red-500">{errors.password_confirm.message}</p>}
              </div>
            </div>
            
            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full shadow-glow"
              >
                {isSubmitting ? 'Registrando...' : 'Registrarse'}
              </Button>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="justify-center">
          <div className="text-sm text-textMuted">
             ¿Ya tienes cuenta? <Link href="/login" className="text-primary hover:text-primaryHover hover:underline transition-colors">Inicia sesión aquí</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
