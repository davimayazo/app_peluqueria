"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchProfile, updateProfile } from '@/lib/api';
import { useAuth } from '@/store/useAuth';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user: authUser, updateUser } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: fetchProfile,
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile: {
      phone: '',
    }
  });

  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        profile: {
          phone: profile.profile?.phone || '',
        }
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['profile', authUser?.id], updatedUser);
      // Actualizar el usuario en el store global de auth
      if (authUser) {
        updateUser({
          ...authUser,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
        });
      }
      setSuccess(true);
      setErrorMsg(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error: any) => {
      setErrorMsg(error.message || 'Error al actualizar el perfil');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Mi Perfil</h1>
            <p className="text-textMuted">Gestiona tu información personal</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                ¡Perfil actualizado con éxito!
              </div>
            )}
            
            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                {errorMsg}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Datos Personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-textMuted">Nombre</label>
                    <input
                      type="text"
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-textMuted">Apellidos</label>
                    <input
                      type="text"
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-textMuted">Correo Electrónico</label>
                  <input
                    type="email"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-textMuted">Teléfono</label>
                  <input
                    type="text"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.profile.phone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      profile: { ...formData.profile, phone: e.target.value } 
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="px-8 shadow-glow"
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
