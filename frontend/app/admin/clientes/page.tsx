"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchUsers, registerUser, updateUser, deleteUser, fetchAppointments } from '@/lib/api';
import { User, Appointment } from '@/types';

export default function AdminClientes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [historyClient, setHistoryClient] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    points: 0
  });

  // Queries
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: fetchUsers
  });

  const { data: allAppointments } = useQuery({
    queryKey: ['admin_all_appointments'],
    queryFn: fetchAppointments
  });

  const createMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      closeModal();
    },
    onError: (err: any) => setError(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      closeModal();
    },
    onError: (err: any) => setError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
    onError: (err: any) => alert(err.message)
  });

  const clients = users?.filter((u: User) => {
    const isClient = u.profile?.role === 'cliente';
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.username.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.profile?.phone?.includes(searchTerm);
    return isClient && matchesSearch;
  }) || [];

  const clientHistory = allAppointments?.filter((appt: Appointment) => appt.client === historyClient?.id)
    .sort((a: Appointment, b: Appointment) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()) || [];

  const openModal = (user: User | null = null) => {
    setError(null);
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        password: '',
        password_confirm: '',
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.profile?.phone || '',
        points: user.profile?.points || 0
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        phone: '',
        points: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const openHistoryModal = (client: User) => {
    setHistoryClient(client);
    setIsHistoryModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      const { password, password_confirm, phone, points, ...userData } = formData;
      const updateData = {
        ...userData,
        profile: {
          phone,
          points
        }
      };
      updateMutation.mutate({ id: selectedUser.id, data: updateData });
    } else {
      if (formData.password !== formData.password_confirm) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (user: User) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente ${user.full_name || user.username}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'barbero']}>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="mb-8 border-b border-border pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary mb-2">Gestión de Clientes</h1>
              <p className="text-textMuted">Base de datos de clientes registrados</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Alta Cliente
            </button>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textMuted">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, usuario o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surfaceLayer border border-border rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Lista de Clientes ({clients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {clients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-textMuted text-sm">
                          <th className="p-4 font-medium uppercase tracking-wider">Nombre Completo</th>
                          <th className="p-4 font-medium uppercase tracking-wider">Usuario</th>
                          <th className="p-4 font-medium uppercase tracking-wider">Email</th>
                          <th className="p-4 font-medium uppercase tracking-wider">Puntos</th>
                          <th className="p-4 font-medium uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map((user: User) => (
                          <tr key={user.id} className="border-b border-border/50 hover:bg-surfaceLayer transition-colors group">
                            <td className="p-4 font-medium text-white">{user.full_name || `${user.first_name} ${user.last_name}`}</td>
                            <td className="p-4 text-textMuted">{user.username}</td>
                            <td className="p-4 text-textMuted">{user.email}</td>
                            <td className="p-4 font-bold text-primary">{user.profile?.points || 0}</td>
                            <td className="p-4 text-right flex justify-end gap-2">
                              <button
                                onClick={() => openHistoryModal(user)}
                                className="p-2 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Ver Historial"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              </button>
                              <button
                                onClick={() => openModal(user)}
                                className="p-2 text-textMuted hover:text-white hover:bg-surface rounded-lg transition-colors"
                                title="Editar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-textMuted border-2 border-dashed border-border rounded-xl">
                    No se encontraron clientes con esos criterios.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        {/* Modal Historial */}
        {isHistoryModalOpen && historyClient && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
            <div className="bg-surfaceLayer border border-border w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-300 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Historial de Citas</h2>
                  <p className="text-primary font-medium">{historyClient.full_name || historyClient.username}</p>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-surface rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textMuted"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {clientHistory.length > 0 ? (
                <div className="space-y-4">
                  {clientHistory.map((appt: Appointment) => (
                    <div key={appt.id} className="p-5 bg-surface border border-border/50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-primary/30 transition-all">
                      <div className="flex gap-4 items-center">
                        <div className="bg-surfaceLayer p-3 rounded-xl text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{appt.service_name}</p>
                          <p className="text-sm text-textMuted">
                            {format(parseISO(appt.start_datetime), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-border/30 pt-3 md:pt-0">
                        <div className="text-right">
                          <p className="text-sm text-textMuted">Barbero: <span className="text-white font-medium">{appt.barber_name}</span></p>
                          <p className="text-primary font-bold">{parseFloat(appt.price_at_booking).toFixed(2)} €</p>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${appt.status === 'completada' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            appt.status === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              appt.status === 'cancelada' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                          {appt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-surface rounded-2xl border-2 border-dashed border-border">
                  <p className="text-textMuted">Este cliente aún no tiene citas en su historial.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Alta/Edición */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-surfaceLayer border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200">
              <h2 className="text-2xl font-bold text-white mb-6">
                {selectedUser ? 'Editar Cliente' : 'Alta Nuevo Cliente'}
              </h2>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Nombre</label>
                    <input type="text" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Apellidos</label>
                    <input type="text" required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Teléfono</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1 font-bold text-primary italic">Puntos de Fidelización</label>
                    <input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-primary/30 rounded-lg px-4 py-2 text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                {!selectedUser && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Contraseña</label>
                      <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Confirmar Contraseña</label>
                      <input type="password" required value={formData.password_confirm} onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                  </div>
                )}
                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-surface border border-border text-white rounded-lg hover:bg-surface/80 transition-colors">Cancelar</button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {selectedUser ? 'Guardar Cambios' : 'Dar de Alta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
