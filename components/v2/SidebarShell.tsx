import React, { useState } from 'react';
import { 
  Home, TrendingUp, Wallet, Landmark, 
  Briefcase, GraduationCap, Zap, Users, 
  Heart, BookOpen, ChevronLeft, ChevronRight,
  LogOut, Settings, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SidebarShellProps = {
  title: string;
  subtitle?: string;
  navItems: { id: string; label: string; icon?: React.ReactNode; group?: 'EMPIRE' | 'GROWTH' | 'LIFE' }[];
  activeItemId: string;
  onNavigate: (id: string) => void;
  headerLeading?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  onLogout?: () => void;
};

const SidebarShell: React.FC<SidebarShellProps> = ({
  title,
  subtitle,
  navItems,
  activeItemId,
  onNavigate,
  headerLeading,
  headerActions,
  children,
  onLogout
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Group items
  const groups = {
    EMPIRE: navItems.filter(i => i.group === 'EMPIRE' || !i.group),
    GROWTH: navItems.filter(i => i.group === 'GROWTH'),
    LIFE: navItems.filter(i => i.group === 'LIFE'),
  };

  const SidebarItem = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = item.id === activeItemId;
    return (
      <button
        onClick={() => onNavigate(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
          ${isActive 
            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-300 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700/50 border border-transparent'}
        `}
      >
        <span className={`${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
          {item.icon}
        </span>
        
        {!isCollapsed && (
          <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
        )}
        
        {isActive && !isCollapsed && (
          <motion.div 
            layoutId="active-pill"
            className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          />
        )}
        
        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-slate-700">
            {item.label}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#0a0f1a] text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="flex-shrink-0 relative bg-[#0a0f1a]/80 backdrop-blur-xl border-r border-slate-800/60 flex flex-col z-50"
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/40">
           <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20 flex-shrink-0">
               T
             </div>
             {!isCollapsed && (
               <div className="flex flex-col">
                 <span className="font-bold text-lg leading-tight tracking-tight text-white">{title}</span>
                 {subtitle && <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">{subtitle}</span>}
               </div>
             )}
           </div>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-50 shadow-lg"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 glass-scroll">
          {/* Group: EMPIRE */}
          <div className="space-y-1">
            {!isCollapsed && <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Empire</div>}
            {groups.EMPIRE.map(item => <SidebarItem key={item.id} item={item} />)}
          </div>

          {/* Group: GROWTH */}
          <div className="space-y-1">
            {!isCollapsed && <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Growth</div>}
            {groups.GROWTH.map(item => <SidebarItem key={item.id} item={item} />)}
          </div>

          {/* Group: LIFE */}
          <div className="space-y-1">
            {!isCollapsed && <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Life</div>}
            {groups.LIFE.map(item => <SidebarItem key={item.id} item={item} />)}
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/40">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="text-slate-400 group-hover:text-red-400 transition-colors" />
            {!isCollapsed && (
              <div className="text-left overflow-hidden">
                <div className="text-sm font-medium text-slate-300 group-hover:text-red-300">Logout</div>
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-emerald-500/5 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800/40 bg-[#0a0f1a]/50 backdrop-blur-sm z-40 shrink-0">
           <div className="flex items-center gap-4">
             {headerLeading} 
             {/* Date Display could go here if not in headerLeading */}
           </div>
           
           <div className="flex items-center gap-4">
              {headerActions}
           </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto glass-scroll p-6 md:p-8 relative z-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarShell;
