"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/useAuth';
import { Button } from '@/components/ui/Button';
import { fetchBusinessConfig } from '@/lib/api';

export default function Navbar() {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const { data: config } = useQuery({ 
    queryKey: ['business_config'], 
    queryFn: fetchBusinessConfig 
  });

  const businessName = config?.name || 'BarberBook';

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primaryHover">
              {businessName}
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link href="/login" className="text-textMuted hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Iniciar Sesión
                  </Link>
                  <Link href="/registro">
                    <Button variant="default" size="sm">Regístrate</Button>
                  </Link>
                </>
              ) : (
                <>
                  {hasRole('admin') ? (
                    <Link href="/admin/dashboard" className="text-textMuted hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Panel Admin</Link>
                  ) : (
                    <>
                      <Link href="/cliente/dashboard" className="text-textMuted hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Mis Citas</Link>
                      <Link href="/reserva">
                        <Button variant="default" size="sm">Reservar Ahora</Button>
                      </Link>
                    </>
                  )}
                  <span className="text-sm text-textMuted border-l border-border pl-4 ml-2">
                    {user?.first_name || user?.username}
                  </span>
                  <button onClick={logout} className="text-textMuted hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Salir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
