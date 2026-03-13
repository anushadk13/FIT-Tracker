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

  const ActiveComponent = NAV_ITEMS.find(n => n.id === active)?.component
  const activeItem = NAV_ITEMS.find(n => n.id === active)

  return (
    <div className="flex min-h-screen bg-[#0a0e1a]">
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-screen bg-[#080c17] border-r border-white/5 flex flex-col z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Toggle Logo Area */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between p-6 border-b border-white/5 h-[81px] cursor-pointer hover:bg-white/[0.02] transition-colors group"
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3 fade-in">
              <div className="w-9 h-9 gradient-green rounded-xl flex items-center justify-center text-[#0a0e1a] font-black text-lg pulse-glow group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <div className="transition-opacity group-hover:opacity-80">
                <p className="text-white font-bold text-sm leading-tight">FitTracker</p>
                <p className="text-slate-600 text-[10px]">by Anusha</p>
              </div>
            </div>
          )}
          {isCollapsed && (
             <div className="w-full flex justify-center fade-in">
               <div className="w-9 h-9 gradient-green rounded-xl flex items-center justify-center text-[#0a0e1a] font-black text-lg pulse-glow hover:scale-110 transition-transform">
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
                    ? 'bg-white/8 border border-white/10 shadow-lg'
                    : 'hover:bg-white/4 border border-transparent'
                  } ${isCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3'}`}
                style={isActive && !isCollapsed ? { borderLeftColor: item.accent, borderLeftWidth: 3 } : {}}
                title={isCollapsed ? item.label : ''}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${isCollapsed ? '' : 'w-6 text-center'}`}>{item.icon}</span>
                {!isCollapsed && (
                  <div className="fade-in">
                    <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium tracking-tight whitespace-nowrap">{item.desc}</p>
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          {isCollapsed ? (
            <div className="w-full text-center text-[8px] text-slate-700 font-black">V1.0</div>
          ) : (
            <p className="text-[10px] text-slate-600 text-center font-bold uppercase tracking-widest opacity-50">Precision Tracking</p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ease-in-out flex-1 min-h-screen ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5 px-8 py-[18px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-white/5 border border-white/10`}>
              {activeItem?.icon}
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight leading-tight uppercase">{activeItem?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 rounded-full border border-green-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-neon-green text-[10px] font-black uppercase tracking-widest">Live Audit</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8 max-w-[1600px] mx-auto">
          {ActiveComponent && <ActiveComponent key={active} />}
        </div>
      </main>
    </div>
  )
}

export default App
