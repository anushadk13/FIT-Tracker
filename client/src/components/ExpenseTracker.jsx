import { useState, useEffect, useMemo } from 'react'

const API = ''

const ENTRY_ITEMS = [
  { id: 'greek_yogurt', label: 'Greek yogurt' },
  { id: 'soymilk', label: 'Soymilk' },
  { id: 'veg_protein', label: 'Vegetable protein' },
  { id: 'bread', label: 'Bread' },
]

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([])
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [gridData, setGridData] = useState(
    ENTRY_ITEMS.reduce((acc, item) => ({
      ...acc,
      [item.id]: { quantity: '', cost: '', serving: '' }
    }), {})
  )
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [submitting, setSubmitting] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = () => {
    fetch(`${API}/api/expenses/`)
      .then(r => r.json())
      .then(setExpenses)
  }

  const numDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 0
  }, [startDate, endDate])

  const totalAud = useMemo(() => {
    return Object.values(gridData).reduce((sum, item) => {
      const val = parseFloat(item.cost)
      return sum + (isNaN(val) ? 0 : val)
    }, 0).toFixed(2)
  }, [gridData])

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleGridChange = (itemId, field, value) => {
    setGridData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }))
  }

  const handleLogAll = async () => {
    setSubmitting(true)
    const itemsToLog = ENTRY_ITEMS.filter(item => {
      const data = gridData[item.id]
      return data.cost && parseFloat(data.cost) > 0
    })

    if (itemsToLog.length === 0) {
      setSubmitting(false)
      return
    }

    try {
      for (const item of itemsToLog) {
        const data = gridData[item.id]
        await fetch(`${API}/api/expenses/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: startDate,
            end_date: endDate || null,
            item: item.label,
            quantity: data.quantity,
            cost: parseFloat(data.cost),
            serving_size: data.serving,
            num_days: numDays
          }),
        })
      }

      setGridData(
        ENTRY_ITEMS.reduce((acc, item) => ({
          ...acc,
          [item.id]: { quantity: '', cost: '', serving: '' }
        }), {})
      )
      fetchExpenses()
    } catch (err) {
      console.error('Batch logging failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    await fetch(`${API}/api/expenses/${id}`, { method: 'DELETE' })
    fetchExpenses()
  }

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr + 'T12:00:00')
    const day = d.getDate()
    const s = ["th", "st", "nd", "rd"]
    const v = day % 100
    const suffix = (s[(v - 20) % 10] || s[v] || s[0])
    return `${day}${suffix}`
  }

  const formatRange = (start, end) => {
    const s = new Date(start + 'T12:00:00')
    const months = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
    const month = months[s.getMonth()]

    if (!end || start === end) return `${month} - ${formatDateShort(start)}`

    const e = new Date(end + 'T12:00:00')
    if (s.getMonth() === e.getMonth()) {
      return `${month} (${formatDateShort(start)} - ${formatDateShort(end)})`
    }

    const endMonth = months[e.getMonth()]
    return `${month} ${formatDateShort(start)} - ${endMonth} ${formatDateShort(end)}`
  }

  const groupedExpenses = useMemo(() => {
    const monthExp = expenses.filter(e => (e.date || '').slice(0, 7) === filterMonth)
    const groups = {}

    monthExp.forEach(exp => {
      const key = `${exp.date}_${exp.end_date || 'single'}`
      if (!groups[key]) {
        groups[key] = {
          id: key,
          date: exp.date,
          end_date: exp.end_date,
          totalCost: 0,
          items: []
        }
      }
      groups[key].totalCost += parseFloat(exp.cost)
      groups[key].items.push(exp)
    })

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, filterMonth])

  const formatMonth = (ym) => {
    if (!ym) return ''
    const [y, m] = ym.split('-')
    const date = new Date(y, parseInt(m) - 1)
    return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  }

  const monthlyTotal = useMemo(() => {
    return groupedExpenses.reduce((sum, g) => sum + g.totalCost, 0).toFixed(2)
  }, [groupedExpenses])

  const months = [...new Set(expenses.map(e => (e.date || '').slice(0, 7)))].sort().reverse()
  if (!months.includes(filterMonth)) months.unshift(filterMonth)

  return (
    <div className="fade-in space-y-8 max-w-7xl mx-auto pb-20">
      {/* Dynamic Header Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Financial Audit</h2>
          <div className="mt-2 text-slate-400 font-bold text-sm flex items-center gap-2">
            <span>{formatRange(startDate, endDate)}</span>
            <span className="opacity-30">→</span>
            <span className="text-neon-blue">{numDays} Days</span>
            <span className="opacity-30">→</span>
            <span className="text-white bg-white/10 px-2 py-0.5 rounded-md">{totalAud} AUD</span>
          </div>
        </div>
        <div className="flex bg-black/20 p-2 rounded-2xl border border-white/5 space-x-4">
          <div className="space-y-1">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-2">From</p>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none px-2"
            />
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="space-y-1">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-2">To</p>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none px-2"
            />
          </div>
        </div>
      </div>

      {/* Entry Table */}
      <div className="glass rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10">
                <th className="py-6 px-8 text-slate-500 text-[10px] font-black uppercase tracking-widest border-r border-white/5 w-48">Asset Class</th>
                <th className="py-6 px-6 text-slate-500 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Quantity</th>
                <th className="py-6 px-6 text-slate-500 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Total Cost</th>
                <th className="py-6 px-6 text-slate-500 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Daily Serving</th>
                <th className="py-6 px-6 text-slate-500 text-[10px] font-black uppercase tracking-widest border-r border-white/5">Duration</th>
                <th className="py-6 px-6 text-slate-500 text-[10px] font-black uppercase tracking-widest">Entry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {ENTRY_ITEMS.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.01]">
                  <td className="py-5 px-8 font-bold text-white border-r border-white/5">{item.label}</td>
                  <td className="py-5 px-6 border-r border-white/5">
                    <input
                      placeholder="1kg - 1000g"
                      value={gridData[item.id].quantity}
                      onChange={e => handleGridChange(item.id, 'quantity', e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:border-neon-blue outline-none placeholder:text-slate-700"
                    />
                  </td>
                  <td className="py-5 px-6 border-r border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={gridData[item.id].cost}
                        onChange={e => handleGridChange(item.id, 'cost', e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:border-neon-blue outline-none"
                      />
                    </div>
                  </td>
                  <td className="py-5 px-6 border-r border-white/5">
                    <input
                      placeholder="100g"
                      value={gridData[item.id].serving}
                      onChange={e => handleGridChange(item.id, 'serving', e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:border-neon-blue outline-none placeholder:text-slate-700"
                    />
                  </td>
                  <td className="py-5 px-6 border-r border-white/5">
                    <div className="text-slate-400 font-bold text-xs bg-black/20 px-3 py-1.5 rounded-lg inline-block">
                      {numDays > 0 ? `${numDays} Days` : '-'}
                    </div>
                  </td>
                  <td className="py-5 px-6 italic text-slate-500 text-xs">
                    {formatRange(startDate, endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-black/20 flex justify-between items-center border-t border-white/5">
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Awaiting Entry for {ENTRY_ITEMS.length} Items</div>
          <button
            onClick={handleLogAll}
            disabled={submitting}
            className="gradient-blue text-[#0a0e1a] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl hover:scale-105 transition-all shadow-lg shadow-neon-blue/20 disabled:opacity-30 text-xs"
          >
            {submitting ? '...' : 'Done'}
          </button>
        </div>
      </div>

      {/* Historical Audit Table - NOW COLLAPSED */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-white text-lg font-black uppercase tracking-widest">Historical Audits</h3>
          <div className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
            >
              {months.map(m => (
                <option key={m} value={m} className="bg-[#0a0e1a]">{formatMonth(m)}</option>
              ))}
            </select>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-0.5">{formatMonth(filterMonth).split(' ')[0]} Total:</span>
              <span className="text-neon-blue font-black text-sm">${monthlyTotal}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {groupedExpenses.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-slate-600 font-medium">No records found for this period.</div>
          ) : groupedExpenses.map(group => {
            const isExpanded = expandedGroups.has(group.id)
            return (
              <div key={group.id} className="glass rounded-[2rem] overflow-hidden border border-white/5 group transition-all">
                {/* Collapsed Summary Header */}
                <div
                  onClick={() => toggleGroup(group.id)}
                  className="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-white font-black text-base">{formatRange(group.date, group.end_date)}</span>
                      <div className="flex items-center gap-2">
                        {group.items.slice(0, 3).map((it, idx) => (
                          <span key={idx} className="bg-white/5 text-[9px] text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase">{it.item.split(' ')[0]}</span>
                        ))}
                        {group.items.length > 3 && <span className="text-[9px] text-slate-600 font-bold">+{group.items.length - 3} more</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-neon-blue text-xl font-black">${group.totalCost.toFixed(2)}</p>
                      <p className="text-[9px] text-slate-600 font-bold uppercase">Total AUD</p>
                    </div>
                    <span className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </div>

                {/* Expanded Details Table */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] border-b border-white/5">
                          <th className="py-3 px-4 text-left">Component Item</th>
                          <th className="py-3 px-4 text-left">Quantity / Serving</th>
                          <th className="py-3 px-4 text-center">Duration</th>
                          <th className="py-3 px-4 text-right">Cost</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {group.items.map(exp => (
                          <tr key={exp.id} className="hover:bg-white/[0.01]">
                            <td className="py-3 px-4 text-white font-bold">{exp.item}</td>
                            <td className="py-3 px-4 text-slate-400 text-xs">
                              {exp.quantity} {exp.serving_size ? `(${exp.serving_size}/day)` : ''}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-[10px] text-slate-600 font-black">{exp.num_days || 1}D</span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-300">${exp.cost}</td>
                            <td className="py-3 px-4 text-center">
                              <button onClick={() => handleDelete(exp.id)} className="text-slate-700 hover:text-red-400 font-black">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
