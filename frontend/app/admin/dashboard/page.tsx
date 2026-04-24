"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchAppointments, fetchServices, fetchBarbers, fetchUsers, fetchBusinessConfig, fetchProductSales, fetchProducts } from '@/lib/api';
import { Appointment, Barber, Service, User } from '@/types';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

  const { data: appointments, isLoading: loadingAppts } = useQuery<Appointment[]>({
    queryKey: ['admin_appointments'],
    queryFn: fetchAppointments
  });

  const { data: services } = useQuery({ queryKey: ['services'], queryFn: fetchServices });
  const { data: barbers } = useQuery({ queryKey: ['barbers'], queryFn: fetchBarbers });
  const { data: allUsers } = useQuery({ queryKey: ['admin_users'], queryFn: fetchUsers });
  const { data: config } = useQuery({ queryKey: ['business_config'], queryFn: fetchBusinessConfig });
  const { data: sales } = useQuery({ queryKey: ['product_sales'], queryFn: fetchProductSales });

  // Shortcuts
  const setRange = (type: 'today' | 'week' | 'month') => {
    const now = new Date();
    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'week') {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (type === 'month') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    }
  };

  // Calculate Metrics based on Range
  const rangeAppointments = Array.isArray(appointments) ? appointments.filter((a: Appointment) => {
    const apptDate = format(parseISO(a.start_datetime), 'yyyy-MM-dd');
    return apptDate >= startDate && apptDate <= endDate;
  }) : [];

  const activeAppointments = rangeAppointments.filter((a: Appointment) => a.status === 'confirmada' || a.status === 'completada');
  const totalRevenue = activeAppointments.reduce((acc: number, curr: Appointment) => acc + parseFloat(curr.price_at_booking), 0);
  
  const newCustomers = Array.isArray(allUsers) ? allUsers.filter((u: User) => {
    if (u.profile?.role !== 'cliente') return false;
    const joinDate = format(parseISO(u.date_joined), 'yyyy-MM-dd');
    return joinDate >= startDate && joinDate <= endDate;
  }) : [];

  // Calculate Per-Barber Metrics
  const barbersArray = Array.isArray(barbers) ? barbers : [];
  const barberStats = barbersArray.map((barber: Barber) => {
    const appts = activeAppointments.filter(a => a.barber === barber.id);
    const revenue = appts.reduce((acc, curr) => acc + parseFloat(curr.price_at_booking), 0);
    const servicesCount = appts.length;
    
    const servicesSummary = appts.reduce((acc: Record<string, number>, curr) => {
      acc[curr.service_name] = (acc[curr.service_name] || 0) + 1;
      return acc;
    }, {});

    return {
      ...barber,
      revenue,
      servicesCount,
      servicesSummary
    };
  }).sort((a: any, b: any) => b.revenue - a.revenue);

  // Calculate Per-Service Metrics
  const servicesArray = Array.isArray(services) ? services : [];
  const serviceStats = servicesArray.map((service: Service) => {
    const appts = activeAppointments.filter(a => a.service === service.id);
    const revenue = appts.reduce((acc: number, curr: any) => acc + parseFloat(curr.price_at_booking), 0);
    const count = appts.length;
    return {
      ...service,
      revenue,
      count
    };
  }).sort((a: any, b: any) => b.revenue - a.revenue);

  // Calculate Product Metrics
  const productsArray = Array.isArray(products) ? products : ((products as any)?.results || []);
  const salesArray = Array.isArray(sales) ? sales : ((sales as any)?.results || []);

  const productStats = productsArray.map((product: any) => {
    const productSales = salesArray.filter((s: any) => {
      // Comparación de IDs
      const saleProdId = Number(s.product?.id || s.product);
      const currentProdId = Number(product.id);
      if (saleProdId !== currentProdId) return false;
      
      // Comparación de fecha ultra-flexible
      const dateStr = String(s.created_at);
      return dateStr.includes(startDate) || dateStr.includes(endDate) || (startDate <= dateStr.substring(0, 10) && dateStr.substring(0, 10) <= endDate);
    });

    const unitsSold = productSales.length;
    const revenue = productSales.reduce((acc: number, curr: any) => {
      const price = parseFloat(String(curr.price_at_sale)) || 0;
      const discount = parseFloat(String(curr.discount_applied)) || 0;
      return acc + (price - discount);
    }, 0);

    return {
      ...product,
      unitsSold,
      revenue
    };
  }).sort((a: any, b: any) => b.revenue - a.revenue);

  const productRevenue = productStats.reduce((acc: number, curr: any) => acc + curr.revenue, 0);

  const isSingleDay = startDate === endDate;
  const rangeLabel = isSingleDay 
    ? (startDate === todayStr ? 'Hoy' : format(parseISO(startDate), "d 'de' MMMM", { locale: es }))
    : `${format(parseISO(startDate), "d MMM", { locale: es })} - ${format(parseISO(endDate), "d MMM", { locale: es })}`;

  // Configuration for widgets visibility
  const showAppointments = config?.show_appointments_widget ?? true;
  const showRevenue = config?.show_revenue_widget ?? true;
  const showServices = config?.show_services_widget ?? true;
  const showStaff = config?.show_staff_widget ?? true;
  const showNewCustomers = config?.show_new_customers_widget ?? true;
  const showAgenda = config?.show_agenda_widget ?? true;
  const showProducts = config?.show_products_widget ?? true;

  // Calculate dynamic grid columns
  const activeWidgetsCount = [showAppointments, showRevenue, showServices, showStaff, showNewCustomers].filter(Boolean).length;
  const gridColsClass = 
    activeWidgetsCount === 5 ? 'lg:grid-cols-5' :
    activeWidgetsCount === 4 ? 'lg:grid-cols-4' :
    activeWidgetsCount === 3 ? 'lg:grid-cols-3' :
    activeWidgetsCount === 2 ? 'lg:grid-cols-2' :
    'lg:grid-cols-1';

  return (
    <ProtectedRoute allowedRoles={['admin', 'barbero']}>
      <div className="min-h-screen bg-background text-textMain flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="mb-8 border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary mb-1">Panel de Control</h1>
              <p className="text-textMuted">Análisis de rendimiento y agenda</p>
            </div>

            {/* DATE FILTER UI */}
            <div className="bg-surfaceLayer p-4 rounded-2xl border border-border/50 flex flex-col gap-4 w-full md:w-auto">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setRange('today')}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${startDate === todayStr && endDate === todayStr ? 'bg-primary text-black border-primary' : 'border-border text-textMuted hover:border-primary/50'}`}
                >
                  Hoy
                </button>
                <button 
                  onClick={() => setRange('week')}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${startDate === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') ? 'bg-primary text-black border-primary' : 'border-border text-textMuted hover:border-primary/50'}`}
                >
                  Esta Semana
                </button>
                <button 
                  onClick={() => setRange('month')}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${startDate === format(startOfMonth(new Date()), 'yyyy-MM-dd') ? 'bg-primary text-black border-primary' : 'border-border text-textMuted hover:border-primary/50'}`}
                >
                  Este Mes
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-textMuted font-bold mb-1 ml-1">Desde</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-textMuted font-bold mb-1 ml-1">Hasta</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {loadingAppts ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* METRICS ROW */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4`}>
                {showAppointments && (
                  <Card className="bg-surfaceLayer border-none shadow-xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                      <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Citas del Periodo</p>
                      <h3 className="text-3xl font-bold text-white">{rangeAppointments.length}</h3>
                    </CardContent>
                  </Card>
                )}
                
                {showRevenue && (
                  <Card className="bg-surfaceLayer border-none shadow-xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                      <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Ingresos Citas</p>
                      <h3 className="text-3xl font-bold text-primary">{totalRevenue.toFixed(2)} €</h3>
                    </CardContent>
                  </Card>
                )}

                {showProducts && (
                  <Card 
                    className="bg-surfaceLayer border border-primary/20 shadow-xl overflow-hidden group cursor-pointer hover:border-primary/50 hover:bg-surfaceLayer/80 transition-all"
                    onClick={() => setIsProductModalOpen(true)}
                  >
                    <CardContent className="p-6 relative">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                        Ventas Productos
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </p>
                      <h3 className="text-3xl font-bold text-white">{productRevenue.toFixed(2)} €</h3>
                    </CardContent>
                  </Card>
                )}

                {showServices && (
                  <Card 
                    className="bg-surfaceLayer border border-primary/20 shadow-xl overflow-hidden group cursor-pointer hover:border-primary/50 hover:bg-surfaceLayer/80 transition-all"
                    onClick={() => setIsServiceModalOpen(true)}
                  >
                    <CardContent className="p-6 relative">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                        Servicios 
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </p>
                      <h3 className="text-3xl font-bold text-white">{services?.length || 0}</h3>
                    </CardContent>
                  </Card>
                )}

                {showStaff && (
                  <Card 
                    className="bg-surfaceLayer border border-primary/20 shadow-xl overflow-hidden group cursor-pointer hover:border-primary/50 hover:bg-surfaceLayer/80 transition-all"
                    onClick={() => setIsStaffModalOpen(true)}
                  >
                    <CardContent className="p-6 relative">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all"></div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                        Staff Activo 
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </p>
                      <h3 className="text-3xl font-bold text-white">{barbers?.length || 0}</h3>
                    </CardContent>
                  </Card>
                )}

                {showNewCustomers && (
                  <Card 
                    className="bg-surfaceLayer border border-primary/20 shadow-xl overflow-hidden group cursor-pointer hover:border-primary/50 hover:bg-surfaceLayer/80 transition-all"
                    onClick={() => setIsUserModalOpen(true)}
                  >
                    <CardContent className="p-6 relative">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all"></div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                        Clientes Nuevos 
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </p>
                      <h3 className="text-3xl font-bold text-white">{newCustomers.length}</h3>
                    </CardContent>
                  </Card>
                )}
              </div>

              {showAgenda && (
                <div className="grid grid-cols-1 gap-8">
                  {/* AGENDA PERIODICA */}
                  <Card className="flex flex-col border-border/40 shadow-2xl">
                    <CardHeader className="border-b border-border/30 pb-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          Agenda: {rangeLabel}
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => window.location.href='/admin/agenda'}>
                          Ver Agenda Completa
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-6">
                      {rangeAppointments.length > 0 ? (
                        <div className="space-y-3">
                          {[...rangeAppointments].sort((a: Appointment, b: Appointment) => a.start_datetime.localeCompare(b.start_datetime)).map((appt: Appointment) => (
                            <div key={appt.id} className="flex items-center justify-between p-4 bg-surface Layer/20 rounded-xl border border-border/30 hover:border-primary/30 transition-all group">
                              <div className="flex gap-4 items-center">
                                <div className="text-center min-w-[70px]">
                                  <p className="font-bold text-primary">{format(parseISO(appt.start_datetime), "HH:mm")}</p>
                                  {!isSingleDay && <p className="text-[10px] text-textMuted uppercase">{format(parseISO(appt.start_datetime), "d MMM")}</p>}
                                </div>
                                <div className="h-10 w-[1px] bg-border/50"></div>
                                <div>
                                  <p className="font-bold text-white group-hover:text-primary transition-colors">{appt.client_name}</p>
                                  <p className="text-xs text-textMuted">{appt.service_name} • <span className="text-primary/80 font-medium">{appt.barber_name}</span></p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  appt.status === 'confirmada' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                  appt.status === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                  appt.status === 'completada' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  appt.status === 'cancelada' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                  'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                }`}>
                                  {appt.status}
                                </span>
                                <p className="text-xs font-bold text-white">{parseFloat(appt.price_at_booking).toFixed(2)} €</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-textMuted py-20 border-2 border-dashed border-border/30 rounded-3xl bg-surface/10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-20"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <p className="text-lg">No hay citas registradas para este periodo.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* STAFF METRICS MODAL */}
          {isStaffModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-surfaceLayer border border-border w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8 border-b border-border/30 pb-6">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white">Rendimiento del Staff</h2>
                    <p className="text-primary font-medium">{rangeLabel}</p>
                  </div>
                  <button onClick={() => setIsStaffModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textMuted"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {barberStats.map((barber: any) => (
                    <Card key={barber.id} className="bg-background/40 border-border/40 overflow-hidden hover:border-primary/40 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-xl font-bold border border-primary/20">
                            {barber.full_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">{barber.full_name}</h4>
                            <p className="text-sm text-textMuted">{barber.servicesCount} servicios realizados</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-xs uppercase text-textMuted font-bold tracking-widest mb-1">Ingresos</p>
                            <p className="text-2xl font-display font-bold text-primary">{barber.revenue.toFixed(2)} €</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-bold text-textMuted uppercase tracking-widest border-b border-border/20 pb-2">Desglose de Servicios</p>
                          {Object.keys(barber.servicesSummary).length > 0 ? (
                            Object.entries(barber.servicesSummary).map(([name, count]: [string, any]) => (
                              <div key={name} className="flex justify-between items-center text-sm">
                                <span className="text-white/80">{name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-textMuted">x{count}</span>
                                  <div className="w-20 bg-border/30 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-primary h-full rounded-full" 
                                      style={{ width: `${(Number(count) / barber.servicesCount) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-textMuted italic py-2">Sin actividad en este periodo.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SERVICE METRICS MODAL */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-surfaceLayer border border-border w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8 border-b border-border/30 pb-6">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white">Rendimiento por Servicio</h2>
                    <p className="text-primary font-medium">{rangeLabel}</p>
                  </div>
                  <button onClick={() => setIsServiceModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textMuted"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {serviceStats.map((service: any) => (
                    <Card key={service.id} className="bg-background/40 border-border/40 overflow-hidden hover:border-primary/40 transition-all">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white text-lg font-bold border border-white/10">
                            {service.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">{service.name}</h4>
                            <p className="text-sm text-textMuted">{service.count} veces reservado</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-12">
                          <div className="text-right min-w-[100px]">
                            <p className="text-[10px] uppercase text-textMuted font-bold tracking-widest mb-1">Precio Unit.</p>
                            <p className="text-lg font-bold text-white">{parseFloat(service.price).toFixed(2)} €</p>
                          </div>
                          <div className="text-right min-w-[120px]">
                            <p className="text-[10px] uppercase text-textMuted font-bold tracking-widest mb-1">Total Generado</p>
                            <p className="text-2xl font-display font-bold text-primary">{service.revenue.toFixed(2)} €</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT PERFORMANCE MODAL */}
          {isProductModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-surfaceLayer border border-border w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8 border-b border-border/30 pb-6">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white">Ventas de Productos</h2>
                    <p className="text-primary font-medium">{rangeLabel}</p>
                  </div>
                  <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textMuted"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {productStats.map((prod: any) => (
                    <Card key={prod.id} className="bg-background/40 border-border/40 overflow-hidden hover:border-primary/40 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary overflow-hidden border border-primary/20">
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold">{prod.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">{prod.name}</h4>
                            <p className="text-sm text-textMuted">{prod.unitsSold} unidades vendidas</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-xs uppercase text-textMuted font-bold tracking-widest mb-1">Total</p>
                            <p className="text-2xl font-display font-bold text-primary">{prod.revenue.toFixed(2)} €</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-border/10">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-textMuted font-bold tracking-widest">Stock Disponible</span>
                            <span className={`text-lg font-bold ${prod.stock < 5 ? 'text-red-400' : 'text-white'}`}>{prod.stock} uds</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] uppercase text-textMuted font-bold tracking-widest">Precio Unit.</span>
                            <span className="text-lg font-bold text-white">{parseFloat(prod.price).toFixed(2)} €</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
          {isUserModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-surfaceLayer border border-border w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8 border-b border-border/30 pb-6">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white">Nuevos Clientes</h2>
                    <p className="text-primary font-medium">Registrados en: {rangeLabel}</p>
                  </div>
                  <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textMuted"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newCustomers.map((user: User) => (
                    <Card key={user.id} className="bg-background/40 border-border/40 overflow-hidden">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{user.full_name}</h4>
                          <p className="text-xs text-textMuted">{user.email}</p>
                          <p className="text-[10px] text-primary mt-1">Registrado el {format(parseISO(user.date_joined), "d 'de' MMMM", { locale: es })}</p>
                        </div>
                        <div className="ml-auto">
                          <Button size="sm" variant="outline" onClick={() => window.location.href='/admin/clientes'}>
                            Ver Ficha
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
