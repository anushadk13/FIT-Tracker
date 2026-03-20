import { useState } from 'react'
import ProteinTracker from './components/ProteinTracker'
import ExpenseTracker from './components/ExpenseTracker'
import GymSchedule from './components/GymSchedule'
import './index.css'

const NAV_ITEMS = [
  {
    id: 'protein',
    label: 'Protein Tracker',
    icon: '🥩',
    desc: 'Daily intake',
    accent: '#39FF14',
    component: ProteinTracker,
  },
  {
    id: 'expenses',
    label: 'Expense Tracker',
    icon: '💸',
    desc: 'Food spending',
    accent: '#00F0FF',
    component: ExpenseTracker,
  },
  {
    id: 'gym',
    label: 'Gym Schedule',
    icon: '🏋️',
    desc: 'Weekly plan',
    accent: '#BF5FFF',
    component: GymSchedule,
  },
]

function App() {
  const [active, setActive] = useState('protein')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(true)

  const toggleTheme = () => setIsDark(!isDark)

  const ActiveComponent = NAV_ITEMS.find(n => n.id === active)?.component
  const activeItem = NAV_ITEMS.find(n => n.id === active)

  return (
    <div className={`${isDark ? 'dark' : ''} flex min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-x-hidden transition-colors duration-300`}>
      {/* Sidebar - Hidden on mobile, collapsible on desktop */}
      <aside 
        className={`fixed top-0 left-0 h-screen bg-[var(--bg-side)] border-r border-[var(--sidebar-border)] flex flex-col z-30 transition-all duration-300 ease-in-out 
          ${isCollapsed ? 'w-20' : 'w-64'} 
          hidden md:flex`}
      >
        {/* Toggle Logo Area */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between p-6 border-b border-[var(--sidebar-border)] h-[81px] cursor-pointer hover:bg-white/[0.02] transition-colors group"
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3 fade-in">
              <div className="w-9 h-9 gradient-green rounded-xl flex items-center justify-center text-black font-black text-lg pulse-glow group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <div className="transition-opacity group-hover:opacity-80">
                <p className="text-[var(--text-main)] font-bold text-sm leading-tight">FitTracker</p>
                <p className="text-[var(--text-dim)] text-[10px]">by Anusha</p>
              </div>
            </div>
          )}
          {isCollapsed && (
             <div className="w-full flex justify-center fade-in">
               <div className="w-9 h-9 gradient-green rounded-xl flex items-center justify-center text-black font-black text-lg pulse-glow hover:scale-110 transition-transform">
                ⚡
               </div>
             </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl text-left transition-all duration-200 group
                  ${isActive
                    ? 'bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-lg'
                    : 'hover:bg-white/4 border border-transparent'
                  } ${isCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3'}`}
                style={isActive && !isCollapsed ? { borderLeftColor: item.accent, borderLeftWidth: 3 } : {}}
                title={isCollapsed ? item.label : ''}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${isCollapsed ? '' : 'w-6 text-center'}`}>{item.icon}</span>
                {!isCollapsed && (
                  <div className="fade-in">
                    <p className={`text-sm font-semibold ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-[var(--text-dim)] font-medium tracking-tight whitespace-nowrap">{item.desc}</p>
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="p-4 border-t border-[var(--sidebar-border)] space-y-4">
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-white/5
              ${isCollapsed ? 'justify-center' : ''}`}
          >
            <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
            {!isCollapsed && (
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
            )}
          </button>
          {!isCollapsed && (
            <p className="text-[10px] text-[var(--text-dim)] text-center font-bold uppercase tracking-widest opacity-50">Precision Tracking</p>
          )}
          {isCollapsed && (
            <div className="w-full text-center text-[8px] text-[var(--text-dim)] font-black">V1.0</div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ease-in-out flex-1 min-h-screen 
        ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} 
        mb-20 md:mb-0`}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--sidebar-border)] px-4 md:px-8 py-3 md:py-[18px] flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 font-inter">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shrink-0">
              {activeItem?.icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-[var(--text-main)] font-black text-base md:text-xl tracking-tight leading-tight uppercase truncate">{activeItem?.label}</h1>
              <p className="text-[var(--text-muted)] text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate">
                {new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          
          {/* Mobile Theme Toggle & Logo */}
          <div className="flex md:hidden items-center gap-3">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center">
              {isDark ? '🌙' : '☀️'}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--glass-bg)] rounded-full border border-[var(--glass-border)]">
               <span className="text-[var(--neon-green)] text-xs font-black">⚡</span>
               <span className="text-[var(--text-main)] text-[9px] font-black uppercase tracking-tighter">FitTracker</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--neon-green)]/5 rounded-full border border-[var(--neon-green)]/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)] animate-pulse" />
              <span className="text-[var(--neon-green)] text-[10px] font-black uppercase tracking-widest">Live Audit</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {ActiveComponent && <ActiveComponent key={`${active}-${isDark}`} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-side)]/95 backdrop-blur-xl border-t border-[var(--sidebar-border)] flex md:hidden items-center justify-around px-2 py-3">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-300 ${isActive ? 'bg-[var(--glass-bg)]' : ''}`}
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-110 -translate-y-1' : 'opacity-40'}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-dim)]'}`}>
                {item.id}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[var(--text-main)] mt-0.5 shadow-[0_0_8px_var(--text-main)]" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default App
