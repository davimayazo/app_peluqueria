import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="w-64 bg-[#111] border-r border-gray-800 h-screen flex flex-col hidden md:flex sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Link href="/" className="text-2xl font-bold text-barber-gold">BarberAdmin</Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/admin/dashboard" className="flex items-center px-4 py-3 text-gray-300 hover:bg-barber-dark hover:text-white rounded-lg transition-colors group">
          <span className="font-medium group-hover:translate-x-1 transition-transform">Dashboard</span>
        </Link>
        <Link href="/admin/agenda" className="flex items-center px-4 py-3 text-gray-300 hover:bg-barber-dark hover:text-white rounded-lg transition-colors group">
          <span className="font-medium group-hover:translate-x-1 transition-transform">Agenda</span>
        </Link>
        <Link href="/admin/servicios" className="flex items-center px-4 py-3 text-gray-300 hover:bg-barber-dark hover:text-white rounded-lg transition-colors group">
          <span className="font-medium group-hover:translate-x-1 transition-transform">Servicios</span>
        </Link>
        <Link href="/admin/clientes" className="flex items-center px-4 py-3 text-gray-300 hover:bg-barber-dark hover:text-white rounded-lg transition-colors group">
          <span className="font-medium group-hover:translate-x-1 transition-transform">Clientes</span>
        </Link>
        <Link href="/admin/barberos" className="flex items-center px-4 py-3 text-gray-300 hover:bg-barber-dark hover:text-white rounded-lg transition-colors group">
          <span className="font-medium group-hover:translate-x-1 transition-transform">Barberos</span>
        </Link>
        <Link href="/admin/productos" className="flex items-center px-4 py-3 text-gray-300 hover:bg-barber-dark hover:text-white rounded-lg transition-colors group">
          <span className="font-medium group-hover:translate-x-1 transition-transform text-primary">Productos (Inventario)</span>
        </Link>
        <Link href="/admin/configuracion" className="flex items-center px-4 py-3 text-gray-300 hover:bg-barber-dark hover:text-white rounded-lg transition-colors group">
          <span className="font-medium group-hover:translate-x-1 transition-transform">Configuración</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <Link href="/login" className="flex items-center px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </div>
  );
}
