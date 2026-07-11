'use client'

import { useState, useTransition, useCallback } from 'react'
import DOMPurify from 'dompurify'
import {
  FileSpreadsheet, FileText, Calendar, ChevronDown,
  ArrowDownLeft, ArrowUpRight, BarChart3, PieChart,
  List, RefreshCw, Receipt,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { formatRupiah } from '@/lib/format'
import {
  getReportData,
  type ReportData,
  type MonthlyTrend,
  type CategoryBreakdown,
} from '@/actions/report'
import { getCategoryIcon } from '@/components/features/categories/category-form-modal'

// ─── Security helpers ───────────────────────────────────────────────────────

// Hapus semua HTML/tag dari string sebelum disisipkan ke document.write().
// Mencegah XSS dari deskripsi transaksi / nama kategori yang berisi payload HTML.
function sanitize(str: string): string {
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

// Cegah CSV/Excel formula injection: kalau field diawali =, +, -, atau @,
// Excel bisa menginterpretasinya sebagai formula saat file dibuka.
function sanitizeCsvField(val: string): string {
  if (/^[=+\-@]/.test(val)) return `'${val}`
    return val
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const PRESETS = [
  { label: 'Bulan ini', getValue: () => { const n = new Date(); return { start: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0,10), end: new Date(n.getFullYear(), n.getMonth()+1, 0).toISOString().slice(0,10) } } },
  { label: 'Bulan lalu', getValue: () => { const n = new Date(); return { start: new Date(n.getFullYear(), n.getMonth()-1, 1).toISOString().slice(0,10), end: new Date(n.getFullYear(), n.getMonth(), 0).toISOString().slice(0,10) } } },
  { label: '3 bulan terakhir', getValue: () => { const n = new Date(); return { start: new Date(n.getFullYear(), n.getMonth()-2, 1).toISOString().slice(0,10), end: new Date(n.getFullYear(), n.getMonth()+1, 0).toISOString().slice(0,10) } } },
  { label: 'Tahun ini', getValue: () => { const n = new Date(); return { start: `${n.getFullYear()}-01-01`, end: `${n.getFullYear()}-12-31` } } },
]

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg shadow-black/5 px-3.5 py-2.5 text-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.fill }} />
        <span className="text-gray-500">{p.name === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
        <span className="font-semibold text-gray-800 ml-auto pl-3">{formatRupiah(p.value)}</span>
        </p>
      ))}
      </div>
    )
}

// ─── Trend Chart ─────────────────────────────────────────────────────────────

function TrendChart({ data }: { data: MonthlyTrend[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
      Belum ada data tren
      </div>
    )
  }

  const chartData = data.map(d => ({
    label: d.label,
    income: d.income,
    expense: d.expense,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
    <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
    <XAxis
    dataKey="label"
    tick={{ fontSize: 11, fill: '#9ca3af' }}
    axisLine={false}
    tickLine={false}
    />
    <YAxis
    tick={{ fontSize: 10, fill: '#9ca3af' }}
    axisLine={false}
    tickLine={false}
    tickFormatter={v => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`
          return String(v)
    }}
    width={52}
    />
    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f9fafb' }} />
    <Bar dataKey="income" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
    <Bar dataKey="expense" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={28} />
    </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Category List ───────────────────────────────────────────────────────────

function CategoryList({ items, type }: { items: CategoryBreakdown[]; type: 'income' | 'expense' }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">Tidak ada data</p>
  }

  return (
    <div className="divide-y divide-gray-50">
    {items.map(cat => {
      const Icon = getCategoryIcon(cat.icon)
      return (
        <div key={cat.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: cat.color + '18' }}
        >
        <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
        </div>
        <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
        <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: cat.color }}>
        {formatRupiah(cat.total)}
        </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
        <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
        />
        </div>
        <div className="flex justify-between">
        <span className="text-[11px] text-gray-400">{cat.count} transaksi</span>
        <span className="text-[11px] font-medium text-gray-500">{cat.percentage.toFixed(1)}%</span>
        </div>
        </div>
        </div>
      )
    })}
    </div>
  )
}

// ─── Export Helpers ──────────────────────────────────────────────────────────

function exportToCSV(data: ReportData, start: string, end: string) {
  const header = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah']
  const rows = data.transactions.map(t => [
    t.date,
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    sanitizeCsvField(t.category?.name ?? 'Tanpa kategori'),
                                     `"${sanitizeCsvField(t.description).replace(/"/g, '""')}"`,
                                     t.amount,
  ])
  const summary = [
    [],
    ['RINGKASAN'],
    ['Total Pemasukan', '', '', '', data.totalIncome],
    ['Total Pengeluaran', '', '', '', data.totalExpense],
    ['Selisih', '', '', '', data.balance],
    [`Periode: ${start} s/d ${end}`],
  ]
  const csv = [header, ...rows, ...summary].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dompetin-laporan-${start}-${end}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportToPDF(data: ReportData, start: string, end: string) {
  // Catatan: sengaja TIDAK memakai flag 'noopener'/'noreferrer' di sini.
  // Window.open() dengan noopener nyaris selalu mengembalikan null di browser
  // modern (karena referensi balik ke window baru memang diputus), sehingga
  // `win` jadi null dan fungsi ini gagal total secara diam-diam.
  // Risiko reverse-tabnabbing yang biasanya dicegah noopener tidak relevan
  // di sini karena window baru hanya diisi konten lokal (document.write),
  // bukan navigasi ke URL eksternal yang bisa dikontrol pihak lain.
  const win = window.open('', '_blank')
  if (!win) {
    alert('Popup diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.')
    return
  }
  // Putus referensi window.opener secara manual sebagai lapisan pengaman tambahan,
  // tanpa membuat window.open() mengembalikan null.
  win.opener = null

  const txRows = data.transactions.map(t => `
  <tr>
  <td>${sanitize(t.date)}</td>
  <td>${sanitize(t.description || '—')}</td>
  <td>${sanitize(t.category?.name ?? '—')}</td>
  <td class="${t.type}">${t.type === 'income' ? '+' : '−'}${formatRupiah(t.amount)}</td>
  </tr>`).join('')

  const catRows = (cats: CategoryBreakdown[]) => cats.map(c => `
  <tr>
  <td>${sanitize(c.name)}</td>
  <td>${c.count}x</td>
  <td>${c.percentage.toFixed(1)}%</td>
  <td>${formatRupiah(c.total)}</td>
  </tr>`).join('')

  win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
  <title>Laporan Dompetin</title>
  <style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;padding:48px;font-size:13px;line-height:1.5}
  .top{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #111}
  .brand{font-size:22px;font-weight:700;letter-spacing:-0.5px}
  .meta{font-size:12px;color:#6b7280;margin-top:4px}
  .kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
  .kpi-card{padding:16px 20px;border-radius:10px;border:1px solid #e5e7eb}
  .kpi-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px}
  .kpi-value{font-size:18px;font-weight:700}
  .green{color:#059669}.red{color:#dc2626}
  h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin:24px 0 10px;padding-bottom:8px;border-bottom:1px solid #f3f4f6}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;padding:8px 12px;background:#f9fafb;border-bottom:1px solid #f3f4f6}
  td{padding:9px 12px;border-bottom:1px solid #f9fafb;font-size:12px}
  .income{color:#059669;font-weight:600}.expense{color:#dc2626;font-weight:600}
  .foot{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
  </style></head><body>
  <div class="top">
  <div>
  <div class="brand">Dompetin</div>
  <div class="meta">Laporan Keuangan · ${formatDate(start)} — ${formatDate(end)}</div>
  </div>
  <div style="font-size:11px;color:#9ca3af">Dicetak: ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
  </div>
  <div class="kpi">
  <div class="kpi-card"><div class="kpi-label">Pemasukan</div><div class="kpi-value green">${formatRupiah(data.totalIncome)}</div></div>
  <div class="kpi-card"><div class="kpi-label">Pengeluaran</div><div class="kpi-value red">${formatRupiah(data.totalExpense)}</div></div>
  <div class="kpi-card"><div class="kpi-label">Selisih</div><div class="kpi-value">${data.balance>=0?'+':'−'}${formatRupiah(Math.abs(data.balance))}</div></div>
  </div>
  <h2>Pengeluaran per Kategori</h2>
  <table><thead><tr><th>Kategori</th><th>Transaksi</th><th>Porsi</th><th>Total</th></tr></thead>
  <tbody>${catRows(data.expenseByCategory)}</tbody></table>
  <h2>Pemasukan per Kategori</h2>
  <table><thead><tr><th>Kategori</th><th>Transaksi</th><th>Porsi</th><th>Total</th></tr></thead>
  <tbody>${catRows(data.incomeByCategory)}</tbody></table>
  <h2>Detail Transaksi (${data.transactions.length})</h2>
  <table><thead><tr><th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Jumlah</th></tr></thead>
  <tbody>${txRows}</tbody></table>
  <div class="foot"><span>Dompetin</span><span>${data.transactions.length} transaksi · ${sanitize(start)} – ${sanitize(end)}</span></div>
  </body></html>`)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

// ─── Main ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'categories' | 'transactions'

export default function ReportsClient({
  initialData,
  initialStart,
  initialEnd,
  error: initialError,
}: {
  initialData: ReportData | null
  initialStart: string
  initialEnd: string
  error: string | null
}) {
  const [data, setData] = useState<ReportData | null>(initialData)
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showPresets, setShowPresets] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(initialError)

  const loadData = useCallback((s: string, e: string) => {
    startTransition(async () => {
      setError(null)
      const result = await getReportData(s, e)
      if (result.error) { setError(result.error); return }
      setData(result.data)
    })
  }, [])

  function applyPreset(preset: typeof PRESETS[0]) {
    const { start: s, end: e } = preset.getValue()
    setStart(s); setEnd(e)
    setShowPresets(false)
    loadData(s, e)
  }

  function applyRange() {
    if (start && end && start <= end) loadData(start, end)
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',      label: 'Ringkasan',  icon: BarChart3 },
    { id: 'categories',   label: 'Kategori',   icon: PieChart  },
    { id: 'transactions', label: 'Transaksi',  icon: List      },
  ]

  const isEmpty = !data || data.transactions.length === 0

  return (
    <div className="flex flex-col h-full bg-gray-50/60">

    {/* HEADER */}
    <div className="bg-white border-b border-gray-100 px-6 pt-5 pb-0 space-y-4">

    {/* Title + exports */}
    <div className="flex items-start justify-between gap-4">
    <div>
    <h1 className="text-[22px] font-medium text-gray-900 tracking-tight">Laporan</h1>
    {data && (
      <p className="text-sm text-gray-400 mt-0.5">
      {formatDateShort(start)} — {formatDateShort(end)}
      <span className="mx-1.5 text-gray-300">·</span>
      {data.transactions.length} transaksi
      </p>
    )}
    </div>

    {!isEmpty && (
      <div className="flex gap-2 flex-shrink-0 mt-0.5">
      <button
      onClick={() => exportToCSV(data!, start, end)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
      Excel
      </button>
      <button
      onClick={() => exportToPDF(data!, start, end)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
      <FileText className="w-3.5 h-3.5 text-red-400" />
      PDF
      </button>
      </div>
    )}
    </div>

    {/* Period picker */}
    <div className="flex flex-wrap items-center gap-2">
    <div className="relative">
    <button
    onClick={() => setShowPresets(v => !v)}
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
    >
    <Calendar className="w-3.5 h-3.5 text-gray-400" />
    Periode
    <ChevronDown className="w-3 h-3 text-gray-400" />
    </button>
    {showPresets && (
      <div className="absolute top-full left-0 mt-1.5 w-44 bg-white rounded-xl border border-gray-100 shadow-xl shadow-black/5 z-20 overflow-hidden py-1">
      {PRESETS.map(p => (
        <button
        key={p.label}
        onClick={() => applyPreset(p)}
        className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
        {p.label}
        </button>
      ))}
      </div>
    )}
    </div>
    <input
    type="date" value={start}
    onChange={e => setStart(e.target.value)}
    className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
    />
    <span className="text-gray-300 text-sm select-none">—</span>
    <input
    type="date" value={end} min={start}
    onChange={e => setEnd(e.target.value)}
    className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
    />
    <button
    onClick={applyRange}
    disabled={isPending}
    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50"
    >
    <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
    Terapkan
    </button>
    </div>

    {/* Tabs */}
    <div className="flex gap-0 -mb-px">
    {tabs.map(tab => {
      const Icon = tab.icon
      const active = activeTab === tab.id
      return (
        <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
          active
          ? 'border-gray-900 text-gray-900'
          : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
        }`}
        >
        <Icon className="w-4 h-4" />
        {tab.label}
        </button>
      )
    })}
    </div>
    </div>

    {/* CONTENT */}
    <div className="flex-1 overflow-auto px-6 py-5">
    {error && (
      <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
      {error}
      </div>
    )}

    {isEmpty ? (
      <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
      <Receipt className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-base font-medium text-gray-700 mb-1">Tidak ada transaksi</p>
      <p className="text-sm text-gray-400">Pilih periode lain atau tambah transaksi terlebih dahulu</p>
      </div>
    ) : (
      <>
      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Pemasukan</p>
        <p className="text-2xl font-medium text-emerald-600 tabular-nums">{formatRupiah(data!.totalIncome)}</p>
        <p className="text-xs text-gray-400 mt-1.5">rata-rata {formatRupiah(data!.avgMonthlyIncome)}/bln</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Pengeluaran</p>
        <p className="text-2xl font-medium text-red-500 tabular-nums">{formatRupiah(data!.totalExpense)}</p>
        <p className="text-xs text-gray-400 mt-1.5">rata-rata {formatRupiah(data!.avgMonthlyExpense)}/bln</p>
        </div>
        <div className={`rounded-2xl border p-5 ${data!.balance >= 0 ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-100'}`}>
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3">Selisih</p>
        <p className={`text-2xl font-medium tabular-nums ${data!.balance >= 0 ? 'text-white' : 'text-orange-500'}`}>
        {data!.balance >= 0 ? '+' : '−'}{formatRupiah(Math.abs(data!.balance))}
        </p>
        <p className={`text-xs mt-1.5 ${data!.balance >= 0 ? 'text-gray-500' : 'text-gray-400'}`}>
        {data!.balance >= 0 ? 'surplus periode ini' : 'defisit periode ini'}
        </p>
        </div>
        </div>

        {/* Trend chart — Recharts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-4">Tren bulanan</p>
        <TrendChart data={data!.monthlyTrend} />
        <div className="flex items-center gap-5 text-xs text-gray-500 mt-3">
        <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block flex-shrink-0" />
        Pemasukan
        </span>
        <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block flex-shrink-0" />
        Pengeluaran
        </span>
        </div>
        </div>

        {/* Monthly table */}
        {data!.monthlyTrend.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Rekap per bulan</p>
          </div>
          <table className="w-full text-sm">
          <thead>
          <tr className="border-b border-gray-50 bg-gray-50/50">
          {['Bulan', 'Pemasukan', 'Pengeluaran', 'Selisih'].map(h => (
            <th
            key={h}
            className={`text-[10px] font-medium text-gray-400 uppercase tracking-wide py-2.5 px-5 ${h === 'Bulan' ? 'text-left' : 'text-right'}`}
            >
            {h}
            </th>
          ))}
          </tr>
          </thead>
          <tbody>
          {[...data!.monthlyTrend].reverse().map(m => (
            <tr key={m.month} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
            <td className="py-3 px-5 font-medium text-gray-700">{m.label}</td>
            <td className="py-3 px-5 text-right font-medium text-emerald-600 tabular-nums">{formatRupiah(m.income)}</td>
            <td className="py-3 px-5 text-right font-medium text-red-500 tabular-nums">{formatRupiah(m.expense)}</td>
            <td className={`py-3 px-5 text-right font-semibold tabular-nums ${m.balance >= 0 ? 'text-gray-900' : 'text-orange-500'}`}>
            {m.balance >= 0 ? '+' : '−'}{formatRupiah(Math.abs(m.balance))}
            </td>
            </tr>
          ))}
          </tbody>
          </table>
          </div>
        )}
        </div>
      )}

      {/* ── CATEGORIES ── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
        <ArrowDownLeft className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Pemasukan per kategori</p>
        </div>
        <CategoryList items={data!.incomeByCategory} type="income" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
        <ArrowUpRight className="w-4 h-4 text-red-400 flex-shrink-0" />
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Pengeluaran per kategori</p>
        </div>
        <CategoryList items={data!.expenseByCategory} type="expense" />
        </div>
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Semua transaksi</p>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
        {data!.transactions.length}
        </span>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
        <thead>
        <tr className="border-b border-gray-50 bg-gray-50/50">
        <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide py-2.5 px-5">Tanggal</th>
        <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide py-2.5 px-5">Deskripsi</th>
        <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide py-2.5 px-5 hidden sm:table-cell">Kategori</th>
        <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wide py-2.5 px-5">Jumlah</th>
        </tr>
        </thead>
        <tbody>
        {data!.transactions.map(t => {
          const Icon = t.category ? getCategoryIcon(t.category.icon) : Receipt
          return (
            <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors">
            <td className="py-3.5 px-5 text-xs text-gray-400 whitespace-nowrap font-medium">{t.date}</td>
            <td className="py-3.5 px-5 font-medium text-gray-800">{t.description || '—'}</td>
            <td className="py-3.5 px-5 hidden sm:table-cell">
            {t.category ? (
              <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium"
              style={{ backgroundColor: t.category.color + '15', color: t.category.color }}
              >
              <Icon className="w-3 h-3" />
              {t.category.name}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Tanpa kategori</span>
            )}
            </td>
            <td className={`py-3.5 px-5 text-right font-semibold tabular-nums whitespace-nowrap text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
            {t.type === 'income' ? '+' : '−'}{formatRupiah(t.amount)}
            </td>
            </tr>
          )
        })}
        </tbody>
        <tfoot>
        <tr className="bg-gray-50/80 border-t border-gray-100">
        <td colSpan={2} className="px-5 py-3.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Total periode</td>
        <td className="hidden sm:table-cell" />
        <td className="px-5 py-3.5 text-right space-y-0.5">
        <div className="text-sm font-semibold text-emerald-600 tabular-nums">+{formatRupiah(data!.totalIncome)}</div>
        <div className="text-sm font-semibold text-red-500 tabular-nums">−{formatRupiah(data!.totalExpense)}</div>
        </td>
        </tr>
        </tfoot>
        </table>
        </div>
        </div>
      )}
      </>
    )}
    </div>
    </div>
  )
}
