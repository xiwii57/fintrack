// app/(dashboard)/dashboard/dashboard-client.tsx
'use client'

import { useState } from 'react'
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
    TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight,
    ArrowDownRight, Download, Calendar,
} from 'lucide-react'
import { formatRupiah, formatShortDate } from '@/lib/format'
import AddTransactionModal from '@/components/features/transactions/add-transaction-modal'
import type { Transaction, MonthlySummary } from '@/types'

interface Props {
    user: { name: string; email: string; avatar: string | null }
    stats: { income: number; expense: number; balance: number; categoryBreakdown: { name: string; color: string; amount: number }[] } | null
    totalBalance: number
    monthly: MonthlySummary[]
    recentTransactions: (Transaction & { category?: { name: string; color: string; icon: string } | null })[]
}

const RADIAN = Math.PI / 180
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
    if (percent < 0.05) return null
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-medium" style={{ fontSize: 11 }}>
            {`${(percent * 100).toFixed(0)}%`}
            </text>
        )
}

function TooltipRupiah({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
        return (
            <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-xs">
            <p className="font-medium text-zinc-700 mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>
                {p.name}: {formatRupiah(p.value)}
                </p>
            ))}
            </div>
        )
}

// Cegah CSV/Excel formula injection: kalau field diawali =, +, -, atau @,
// Excel bisa menginterpretasinya sebagai formula saat file dibuka.
function sanitizeCsvField(val: string): string {
    if (/^[=+\-@]/.test(val)) return `'${val}`
        return val
}

export default function DashboardClient({ user, stats, totalBalance, monthly, recentTransactions }: Props) {
    const [showAdd, setShowAdd] = useState(false)

    const income = stats?.income ?? 0
    const expense = stats?.expense ?? 0
    const balance = stats?.balance ?? 0
    const categoryBreakdown = stats?.categoryBreakdown ?? []

    function handleExport() {
        if (!recentTransactions.length) return
            const rows = [
                ['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Nominal'],
                ...recentTransactions.map(t => [
                    t.date,
                    sanitizeCsvField(t.description),
                                          sanitizeCsvField(t.category?.name ?? '-'),
                                          t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                                          t.amount,
                ]),
            ]
            const csv = rows.map(r => r.join(',')).join('\n')
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `fintrack-${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
            URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-screen bg-zinc-50">
        {/* Header */}
        <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
        {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
        ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium text-zinc-600">
            {user.name.charAt(0).toUpperCase()}
            </div>
        )}
        <div>
        <p className="text-sm font-medium text-zinc-900">{user.name}</p>
        <p className="text-xs text-zinc-400 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </p>
        </div>
        </div>
        <div className="flex items-center gap-2">
        <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export CSV</span>
        </button>
        <button
        onClick={() => setShowAdd(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-700 transition-colors"
        >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Tambah</span>
        </button>
        </div>
        </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
        {/* Total Saldo Keseluruhan */}
        <div className="bg-zinc-900 rounded-xl p-5 text-white flex items-center justify-between">
        <div>
        <p className="text-sm text-zinc-400 mb-1">Total Saldo Keseluruhan</p>
        <p className={`text-3xl font-semibold ${totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
        {formatRupiah(totalBalance)}
        </p>
        <p className="text-xs text-zinc-500 mt-1">Akumulasi seluruh transaksi sejak awal</p>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
        <Wallet className="w-6 h-6 text-white" />
        </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500">Saldo Bulan Ini</p>
        <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
        <Wallet className="w-4 h-4 text-zinc-600" />
        </div>
        </div>
        <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-zinc-900' : 'text-red-500'}`}>
        {formatRupiah(balance)}
        </p>
        <p className="text-xs text-zinc-400 mt-1">Total pemasukan - pengeluaran</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500">Pemasukan</p>
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
        <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        </div>
        <p className="text-2xl font-semibold text-emerald-600">{formatRupiah(income)}</p>
        <p className="text-xs text-zinc-400 mt-1">Bulan ini</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500">Pengeluaran</p>
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
        <TrendingDown className="w-4 h-4 text-red-500" />
        </div>
        </div>
        <p className="text-2xl font-semibold text-red-500">{formatRupiah(expense)}</p>
        <p className="text-xs text-zinc-400 mt-1">Bulan ini</p>
        </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart - 6 bulan */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-medium text-zinc-700 mb-4">Arus Kas 6 Bulan Terakhir</h2>
        <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
        <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
        </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} />
        <Tooltip content={<TooltipRupiah />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)" />
        <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
        </AreaChart>
        </ResponsiveContainer>
        </div>

        {/* Pie Chart - kategori */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-medium text-zinc-700 mb-4">Top Pengeluaran</h2>
        {categoryBreakdown.length > 0 ? (
            <>
            <ResponsiveContainer width="100%" height={160}>
            <PieChart>
            <Pie
            data={categoryBreakdown}
            cx="50%" cy="50%"
            innerRadius={45} outerRadius={75}
            dataKey="amount"
            nameKey="name"
            labelLine={false}
            label={CustomPieLabel}
            >
            {categoryBreakdown.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
            ))}
            </Pie>
            <Tooltip formatter={(value) => [formatRupiah(Number(value)), 'Jumlah']} />
            </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
            {categoryBreakdown.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-zinc-600 truncate max-w-[100px]">{c.name}</span>
                </div>
                <span className="text-zinc-700 font-medium">{formatRupiah(c.amount)}</span>
                </div>
            ))}
            </div>
            </>
        ) : (
            <div className="h-40 flex items-center justify-center text-sm text-zinc-400">
            Belum ada data bulan ini
            </div>
        )}
        </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-medium text-zinc-700 mb-4">Perbandingan Bulanan</h2>
        <ResponsiveContainer width="100%" height={200}>
        <BarChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={20} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} />
        <Tooltip content={<TooltipRupiah />} />
        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
        </ResponsiveContainer>
        </div>

        {/* Transaksi Terbaru */}
        <div className="bg-white rounded-xl border border-zinc-200">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-700">Transaksi Terbaru</h2>
        <a href="/transactions" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
        Lihat semua →
        </a>
        </div>
        {recentTransactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
            Belum ada transaksi. Tambahkan transaksi pertamamu!
            </div>
        ) : (
            <div className="divide-y divide-zinc-50">
            {recentTransactions.map(t => (
                <div key={t.id} className="px-5 py-3.5 flex items-center gap-3">
                <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-medium shrink-0"
                style={{ background: t.category?.color ?? '#6b7280' }}
                >
                {t.category?.name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{t.description}</p>
                <p className="text-xs text-zinc-400">{t.category?.name} · {formatShortDate(t.date)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                {t.type === 'income' ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatRupiah(Number(t.amount))}
                </span>
                </div>
                </div>
            ))}
            </div>
        )}
        </div>
        </div>

        {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
        </div>
    )
}
