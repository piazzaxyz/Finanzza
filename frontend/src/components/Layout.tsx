import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { MenuButton } from './Sidebar';

interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 overflow-y-auto bg-surface">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-border sticky top-0 bg-surface z-10">
          <MenuButton onClick={() => setSidebarOpen(true)} />
          <span className="font-bold text-white">Finanzza</span>
        </div>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
