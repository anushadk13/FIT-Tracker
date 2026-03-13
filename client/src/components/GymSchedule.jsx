import { useState, useEffect, useRef } from 'react'

const API = ''

const DAY_COLORS = {
  Monday: 'text-red-400',
  Tuesday: 'text-orange-400',
  Wednesday: 'text-yellow-400',
  Thursday: 'text-green-400',
  Friday: 'text-neon-blue',
  Saturday: 'text-slate-400',
  Sunday: 'text-slate-400',
}

const WORKOUT_ICONS = {
  Chest: '🏋️', Biceps: '💪', Triceps: '💪', Shoulders: '🏆',
  Back: '🔙', Legs: '🦵', Cardio: '🏃', Rest: '😴',
}

const SYNC_INTERVAL = 120000 // 2 minutes

function getWorkoutIcon(workout) {
  const key = Object.keys(WORKOUT_ICONS).find(k => workout?.includes(k))
  return WORKOUT_ICONS[key] || '🏋️'
}

export default function GymSchedule() {
  const [schedule, setSchedule] = useState([])
  const [pendingIds, setPendingIds] = useState(new Set())
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  const scheduleRef = useRef(schedule)
  const pendingRef = useRef(pendingIds)

  useEffect(() => { scheduleRef.current = schedule }, [schedule])
  useEffect(() => { pendingRef.current = pendingIds }, [pendingIds])

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = () => {
    fetch(`${API}/api/gym/`)
      .then(r => r.json())
      .then(data => {
        setSchedule(data)
        setLastSync(new Date())
      })
  }

  const syncData = async () => {
    const toSync = Array.from(pendingRef.current)
    if (toSync.length === 0) return

    setIsSyncing(true)
    console.log(`[GymSchedule] Syncing ${toSync.length} updates:`, toSync)
    try {
      for (const id of toSync) {
        const entry = scheduleRef.current.find(s => s.id === id)
        if (!entry) continue
        await fetch(`${API}/api/gym/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workout: entry.workout, completed: entry.completed }),
        })
        console.log(`[GymSchedule] Successfully synced ${entry.day_of_week}`)
      }
      setPendingIds(new Set())
      setLastSync(new Date())
      console.log(`[GymSchedule] All changes synced at ${new Date().toLocaleTimeString()}`)
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

  const toggleComplete = (entry) => {
    const updated = { ...entry, completed: !entry.completed }
    setSchedule(prev => prev.map(s => s.id === entry.id ? updated : s))
    setPendingIds(prev => {
      const next = new Set(prev)
      next.add(entry.id)
      return next
    })
  }

  const startEdit = (entry) => {
    setEditing(entry.id)
    setEditValue(entry.workout)
  }

  const saveEdit = (entry) => {
    const updated = { ...entry, workout: editValue }
    setSchedule(prev => prev.map(s => s.id === entry.id ? updated : s))
    setPendingIds(prev => {
      const next = new Set(prev)
      next.add(entry.id)
      return next
    })
    setEditing(null)
  }

  const completed = schedule.filter(s => s.completed).length
  const restDays = schedule.filter(s => s.workout?.toLowerCase().includes('rest')).length
  const workoutDays = schedule.length - restDays

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Gym Schedule</h2>
            <p className="text-slate-400 text-xs md:text-sm">Your weekly workout plan. Changes save every 2 minutes.</p>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            {pendingIds.size > 0 ? (
              <span className="text-[10px] md:text-xs bg-neon-purple/20 text-neon-purple px-3 py-1 rounded-full animate-pulse font-medium">
                {pendingIds.size} unsaved changes
              </span>
            ) : (
              <span className="text-[10px] md:text-xs bg-neon-purple/10 text-neon-purple/60 px-3 py-1 rounded-full font-medium">
                All changes saved
              </span>
            )}
            {lastSync && (
              <p className="text-[9px] md:text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest">
                Last sync: {lastSync.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6">
          <div className="glass rounded-xl p-3 flex-1 text-center">
            <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest">This Week</p>
            <p className="text-neon-purple text-xl md:text-2xl font-black mt-1">{completed}/{workoutDays}</p>
            <p className="text-slate-500 text-[9px] md:text-xs font-bold uppercase tracking-widest">completed</p>
          </div>
          <button 
            onClick={syncData}
            disabled={isSyncing || pendingIds.size === 0}
            className="glass rounded-xl p-3 flex-1 text-center hover:bg-white/5 transition-colors disabled:opacity-30"
          >
            <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest">Syncing Status</p>
            <p className="text-white font-black text-base md:text-lg mt-1">{isSyncing ? 'Syncing...' : 'Sync Now'}</p>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass rounded-2xl p-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Weekly Progress</span>
          <span className="text-neon-purple font-semibold">{workoutDays > 0 ? Math.round((completed / workoutDays) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3">
          <div
            className="gradient-purple h-3 rounded-full transition-all duration-500 neon-glow-purple"
            style={{ width: `${workoutDays > 0 ? (completed / workoutDays) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {schedule.map(entry => {
          const isRest = entry.workout?.toLowerCase().includes('rest')
          const isCompleted = entry.completed
          const isPending = pendingIds.has(entry.id)
          return (
            <div
              key={entry.id}
              className={`glass rounded-2xl p-5 transition-all duration-200 ${isCompleted && !isRest ? 'neon-glow-purple border border-neon-purple/30' : ''} ${isPending ? 'border-yellow-400/30' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-semibold uppercase tracking-widest ${DAY_COLORS[entry.day_of_week] || 'text-slate-400'}`}>
                    {entry.day_of_week}
                  </p>
                  {isPending && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                </div>
                <span className="text-xl">{isRest ? '😴' : getWorkoutIcon(entry.workout)}</span>
              </div>

              {editing === entry.id ? (
                <div className="flex gap-2 mt-2">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(entry); if (e.key === 'Escape') setEditing(null) }}
                    className="flex-1 bg-white/10 border border-neon-purple/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => saveEdit(entry)}
                    className="text-neon-purple hover:text-white px-2 py-1 rounded-lg transition-colors"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => !isRest && startEdit(entry)}
                  className={`text-left w-full font-semibold text-base mb-4 mt-1 ${isRest ? 'text-slate-500 cursor-default' : 'text-white hover:text-neon-purple transition-colors cursor-pointer'}`}
                >
                  {entry.workout || 'Click to set'}
                </button>
              )}

              {!isRest && (
                <label className="flex items-center gap-3 cursor-pointer mt-auto">
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={isCompleted}
                    onChange={() => toggleComplete(entry)}
                  />
                  <span className={`text-sm ${isCompleted ? 'text-neon-green' : 'text-slate-500'}`}>
                    {isCompleted ? 'Done! 🔥' : 'Mark complete'}
                  </span>
                </label>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
