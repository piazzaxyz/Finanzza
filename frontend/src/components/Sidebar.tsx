import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Users, Calendar,
  StickyNote, TrendingUp, LogOut, X, Menu
} from 'lucide-react';

const NAV = [
  { to: '/',            icon: LayoutDashboard,  label: 'Visão Geral'  },
  { to: '/transactions',icon: ArrowLeftRight,    label: 'Transações'   },
  { to: '/family',      icon: Users,             label: 'Família'      },
  { to: '/calendar',    icon: Calendar,          label: 'Calendário'   },
  { to: '/notes',       icon: StickyNote,        label: 'Anotações'    },
];

interface SidebarProps {
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ onLogout, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-surface-card border-r border-surface-border z-30
          flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600/20 rounded-xl flex items-center justify-center border border-brand-600/30">
              <TrendingUp className="w-5 h-5 text-brand-400" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Finanzza</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-border'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-surface-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-sm">
              P
            </div>
            <div>
              <p className="text-sm font-medium text-white">Família Piazza</p>
              <p className="text-xs text-slate-500">Conta privada</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-slate-400
                       hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-surface-border rounded-xl transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
