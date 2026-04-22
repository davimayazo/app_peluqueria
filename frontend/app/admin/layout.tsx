import Sidebar from '@/components/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-barber-dark text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
