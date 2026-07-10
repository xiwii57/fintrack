'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { ACCOUNT_ICON_GROUPS } from '@/lib/account-icons'

const ALL_ICONS = ACCOUNT_ICON_GROUPS.flatMap(g => g.icons)

export default function AccountIconPicker({ value, color, onChange }: {
    value: string
    color: string
    onChange: (v: string) => void
}) {
    const [query, setQuery] = useState('')
    const [activeGroup, setActiveGroup] = useState<string | null>(null)

    const results = useMemo(() => {
        const q = query.toLowerCase().trim()
        if (!q) return null
            return ALL_ICONS.filter(i =>
            i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q)
            )
    }, [query])

    const groups = activeGroup
    ? ACCOUNT_ICON_GROUPS.filter(g => g.group === activeGroup)
    : ACCOUNT_ICON_GROUPS

    return (
        <div className="space-y-2">
        <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setActiveGroup(null) }}
        placeholder="Cari icon…"
        className="w-full pl-9 pr-8 py-2 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
        />
        {query && (
            <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
            <X className="w-3.5 h-3.5" />
            </button>
        )}
        </div>

        {!query && (
            <div className="flex gap-1.5 flex-wrap">
            <button
            type="button"
            onClick={() => setActiveGroup(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                !activeGroup ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
            >
            Semua
            </button>
            {ACCOUNT_ICON_GROUPS.map(g => (
                <button
                key={g.group}
                type="button"
                onClick={() => setActiveGroup(g.group === activeGroup ? null : g.group)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeGroup === g.group ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
                >
                {g.group}
                </button>
            ))}
            </div>
        )}

        <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/50 p-2 space-y-3">
        {results !== null ? (
            results.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-6">Tidak ditemukan</p>
            ) : (
                <div className="grid grid-cols-8 gap-1">
                {results.map(({ value: v, label, Icon }) => (
                    <IconButton key={v} v={v} label={label} Icon={Icon} selected={value === v} color={color} onChange={onChange} />
                ))}
                </div>
            )
        ) : (
            groups.map(g => (
                <div key={g.group}>
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1 mb-1.5">{g.group}</p>
                <div className="grid grid-cols-8 gap-1">
                {g.icons.map(({ value: v, label, Icon }) => (
                    <IconButton key={v} v={v} label={label} Icon={Icon} selected={value === v} color={color} onChange={onChange} />
                ))}
                </div>
                </div>
            ))
        )}
        </div>
        </div>
    )
}

function IconButton({ v, label, Icon, selected, color, onChange }: {
    v: string; label: string; Icon: React.ElementType
    selected: boolean; color: string; onChange: (v: string) => void
}) {
    return (
        <button
        type="button"
        onClick={() => onChange(v)}
        title={label}
        className={`aspect-square flex items-center justify-center rounded-lg transition-all ${
            selected ? 'scale-110' : 'hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700'
        }`}
        style={selected ? { backgroundColor: color + '20', color } : {}}
        >
        <Icon className="w-4 h-4" />
        </button>
    )
}
