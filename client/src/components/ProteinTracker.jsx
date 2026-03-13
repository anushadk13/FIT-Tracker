import { useState, useEffect, useRef, useMemo } from 'react'

const API = import.meta.env.VITE_API_URL || ''

const PROTEIN_VALUES = {
  soy_milk: 7.5,
  greek_yogurt: 6,
  bread: 21.4,
  veg_protein: 26.4,
}

const SYNC_INTERVAL = 120000 // 2 minutes
const MIN_DATE = '2026-03-01'

function getDaysForRange(endDateStr) {
  const days = []
  const end = new Date(endDateStr + 'T12:00:00')

  for (let i = 0; i < 7; i++) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    if (dateStr >= MIN_DATE) {
      days.push(dateStr)
    }
  }
  return days
}

function getTodayStr() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ProteinTracker() {
  const todayStr = getTodayStr()
  const [viewEndDate, setViewEndDate] = useState(todayStr)
  const [logs, setLogs] = useState({})
  const [pendingDates, setPendingDates] = useState(new Set())
  const [lastSync, setLastSync] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const logsRef = useRef(logs)
  const pendingRef = useRef(pendingDates)

  useEffect(() => { logsRef.current = logs }, [logs])
  useEffect(() => { pendingRef.current = pendingDates }, [pendingDates])

  const dates = useMemo(() => getDaysForRange(viewEndDate), [viewEndDate])

  // Aggregate Stats
  const stats = useMemo(() => {
    const activeDates = Object.keys(logs)
    if (activeDates.length === 0) return { avg: 0, streak: 0, goalMet: 0 }

    let totalProtein = 0
    let metGoalCount = 0

    // Check last 7 days from today
    const last7 = getDaysForRange(todayStr)
    last7.forEach(d => {
      const log = logs[d]
      if (log) {
        let daily = 0
        Object.entries(PROTEIN_VALUES).forEach(([k, v]) => { if (log[k]) daily += v })
        totalProtein += daily
        if (daily >= 50) metGoalCount++
      }
    })

    return {
      avg: (totalProtein / 7).toFixed(1),
      metGoalCount,
      percent: Math.round((metGoalCount / 7) * 100)
    }
  }, [logs, todayStr])

  useEffect(() => {
    fetch(`${API}/api/protein/`)
      .then(r => r.json())
      .then(data => {
        const map = {}
        data.forEach(row => {
          map[row.date] = row
        })
        setLogs(map)
        setLastSync(new Date())
      })
  }, [])

  const syncData = async () => {
    const toSync = Array.from(pendingRef.current)
    if (toSync.length === 0) return

    setIsSyncing(true)
    console.log(`[ProteinTracker] Syncing ${toSync.length} dates:`, toSync)
    try {
      for (const date of toSync) {
        const data = logsRef.current[date]
        await fetch(`${API}/api/protein/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        console.log(`[ProteinTracker] Successfully synced ${date}`)
      }
      setPendingDates(new Set())
      setLastSync(new Date())
      console.log(`[ProteinTracker] All changes synced at ${new Date().toLocaleTimeString()}`)
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(syncData, SYNC_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  const toggleFood = (date, field) => {
    const current = logs[date] || { date, soy_milk: false, greek_yogurt: false, bread: false, veg_protein: false }
    const updated = { ...current, [field]: !current[field] }

    setLogs(prev => ({ ...prev, [date]: updated }))
    setPendingDates(prev => {
      const next = new Set(prev)
      next.add(date)
      return next
    })
  }

  const calcTotal = (date) => {
    const log = logs[date]
    if (!log) return 0
    let total = 0
    Object.entries(PROTEIN_VALUES).forEach(([key, val]) => {
      if (log[key]) total += val
    })
    return total.toFixed(1)
  }

  const formatDateLabel = (dateStr) => {
    if (dateStr === todayStr) return 'Today'
    const target = new Date(dateStr + 'T12:00:00')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'

    return target.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getDayShort = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-AU', { weekday: 'short' })
  }

  const handleNext = () => {
    const d = new Date(viewEndDate + 'T12:00:00')
    d.setDate(d.getDate() + 7)
    setViewEndDate(d.toISOString().split('T')[0])
  }

  const handlePrev = () => {
    const d = new Date(viewEndDate + 'T12:00:00')
    d.setDate(d.getDate() - 7)
    const prevStr = d.toISOString().split('T')[0]
    setViewEndDate(prevStr < MIN_DATE ? MIN_DATE : prevStr)
  }

  const foods = [
    { key: 'soy_milk', label: 'Soy Milk', icon: '🥛', gram: '7.5g' },
    { key: 'greek_yogurt', label: 'Yogurt', icon: '🥣', gram: '6g' },
    { key: 'bread', label: 'Bread', icon: '🍞', gram: '21.4g' },
    { key: 'veg_protein', label: 'Veg Prot', icon: '🥗', gram: '26.4g' },
  ]

  return (
    <div className="fade-in space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Smart Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">📈</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Weekly Average</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-white">{stats.avg}</h3>
            <span className="text-neon-green font-bold text-lg">g/day</span>
          </div>
          <p className="text-slate-500 text-[10px] mt-2 italic">Calculated over rolling 7 days</p>
        </div>

        <div className="glass rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">🎯</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Goal Success</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-white">{stats.metGoalCount}/7</h3>
            <span className="text-yellow-400 font-bold text-lg">days</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.5)]" style={{ width: `${stats.percent}%` }} />
          </div>
        </div>

        <div className="glass rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">System Status</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${pendingDates.size > 0 ? 'bg-yellow-400 animate-pulse' : 'bg-neon-green'}`} />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {pendingDates.size > 0 ? 'Syncing' : 'Ready'}
                </span>
              </div>
            </div>
            <button
              onClick={syncData}
              disabled={isSyncing || pendingDates.size === 0}
              className="glass p-2 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-20"
            >
              🔄
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {foods.map(f => (
              <span key={f.key} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-400">
                {f.icon} {f.gram}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Container - Now Responsive */}
      <div className="glass rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
        {/* Table Header / Toolbar */}
        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex bg-black/20 p-1 rounded-xl md:rounded-2xl border border-white/5">
              <button onClick={handlePrev} disabled={viewEndDate <= MIN_DATE} className="p-2 hover:bg-white/5 rounded-lg md:rounded-xl text-slate-400 disabled:opacity-10 transition-all">←</button>
              <button 
                onClick={() => setViewEndDate(todayStr)} 
                className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${viewEndDate === todayStr ? 'bg-neon-green text-[#0a0e1a]' : 'text-slate-500 hover:text-white'}`}
              >
                Today
              </button>
              <button onClick={handleNext} className="p-2 hover:bg-white/5 rounded-lg md:rounded-xl text-slate-400 transition-all">→</button>
            </div>
            <p className="md:hidden text-slate-600 text-[9px] font-black uppercase tracking-widest">Auto-sync 120s</p>
          </div>
          <p className="hidden md:block text-slate-500 text-xs font-medium">Auto-syncing every 120s</p>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="text-left py-6 px-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Timeline</th>
                {foods.map(f => (
                  <th key={f.key} className="py-6 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xl mb-1">{f.icon}</span>
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{f.label}</span>
                    </div>
                  </th>
                ))}
                <th className="py-6 px-8 text-right text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Daily Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {dates.map((date) => {
                const log = logs[date] || {}
                const total = parseFloat(calcTotal(date))
                const isToday = date === todayStr

                return (
                  <tr key={date} className={`group hover:bg-white/[0.02] transition-colors ${isToday ? 'bg-neon-green/[0.02]' : ''}`}>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border-2 transition-transform group-hover:scale-105 ${isToday ? 'bg-neon-green text-black border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'bg-black/20 text-slate-400 border-white/5'
                          }`}>
                          <span className="text-[9px] font-black uppercase">{getDayShort(date)}</span>
                          <span className="text-sm font-black">{date.split('-')[2]}</span>
                        </div>
                        <div>
                          <p className={`text-sm font-black tracking-tight ${isToday ? 'text-neon-green' : 'text-white'}`}>
                            {formatDateLabel(date)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {foods.map(f => (
                      <td key={f.key} className="py-5 px-4 text-center">
                        <div className="relative inline-flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="checkbox-custom scale-110"
                            checked={!!log[f.key]}
                            onChange={() => toggleFood(date, f.key)}
                          />
                        </div>
                      </td>
                    ))}

                    <td className="py-5 px-8 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-lg font-black tracking-tighter ${total === 0 ? 'text-slate-700' :
                             total >= 50 ? 'text-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]' : 'text-yellow-400'
                           }`}>
                          {total > 0 ? `${total}g` : '0.0g'}
                        </span>
                        {total > 0 && (
                          <div className="w-16 h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${total >= 50 ? 'bg-neon-green' : 'bg-yellow-400'}`} style={{ width: `${Math.min((total / 50) * 100, 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className="md:hidden divide-y divide-white/[0.03]">
          {dates.map((date) => {
             const log = logs[date] || {}
             const total = parseFloat(calcTotal(date))
             const isToday = date === todayStr
             
             return (
               <div key={date} className={`px-4 py-5 space-y-4 ${isToday ? 'bg-neon-green/[0.03]' : ''}`}>
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center border shadow-sm ${isToday ? 'bg-neon-green text-black border-neon-green' : 'bg-black/40 text-slate-500 border-white/5'}`}>
                        <span className="text-[8px] font-black uppercase leading-none">{getDayShort(date)}</span>
                        <span className="text-xs font-black">{date.split('-')[2]}</span>
                      </div>
                      <p className={`text-sm font-black tracking-tight ${isToday ? 'text-neon-green' : 'text-slate-200'}`}>
                        {formatDateLabel(date)}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className={`text-base font-black tracking-tighter ${total === 0 ? 'text-slate-700' : total >= 50 ? 'text-neon-green' : 'text-yellow-400'}`}>
                         {total > 0 ? `${total}g` : '0.0g'}
                       </p>
                       <div className="w-12 h-1 bg-white/5 rounded-full mt-1 overflow-hidden ml-auto">
                          <div className={`h-full rounded-full ${total >= 50 ? 'bg-neon-green' : 'bg-yellow-400'}`} style={{ width: `${Math.min((total / 50) * 100, 100)}%` }} />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-4 gap-2">
                    {foods.map(f => (
                      <div 
                        key={f.key} 
                        onClick={() => toggleFood(date, f.key)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all active:scale-95 ${log[f.key] ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 opacity-40'}`}
                      >
                         <span className="text-xl">{f.icon}</span>
                         <span className="text-[8px] font-black uppercase tracking-tight text-slate-500">{f.label}</span>
                      </div>
                    ))}
                 </div>
               </div>
             )
          })}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-4 text-center">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-neon-green" /> Goal Met
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-yellow-400" /> Pending Goal
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 border border-white/20 rounded-full" /> No Intake
        </div>
      </div>
    </div>
  )
}
