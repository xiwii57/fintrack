// components/features/categories/category-form-modal.tsx
'use client'

import { useState, useTransition, useMemo } from 'react'
import { createCategory, updateCategory } from '@/actions/category'
import { Category, TransactionType } from '@/types'
import {
  // Keuangan
  Banknote, Wallet, CreditCard, PiggyBank, TrendingUp, TrendingDown,
  DollarSign, Coins, Receipt, HandCoins, BadgeDollarSign, Landmark,
  // Belanja & Makanan
  ShoppingCart, ShoppingBag, Store, Utensils, UtensilsCrossed, Coffee,
  Pizza, Apple, Wine, Cake, Soup, Sandwich,
  // Transport
  Car, Bus, Train, Plane, Bike, Ship, Truck, Fuel, ParkingCircle, MapPin,
  // Rumah & Utilitas
  Home, Building2, Zap, Wifi, Droplets, Flame, Wrench, Sofa, Key, Tv,
  // Kesehatan
  HeartPulse, Pill, Stethoscope, Activity, Brain, Eye, Smile, Baby,
  // Pendidikan & Kerja
  BookOpen, GraduationCap, Briefcase, Laptop, PenTool, Library, School, Monitor,
  // Hiburan & Lifestyle
  Gamepad2, Music, Film, Camera, Shirt, Scissors, Dumbbell, Flower2,
  Gift, PartyPopper, Sparkles, Star, Dog, Cat, Leaf, Sun,
  // Lainnya
  MoreHorizontal, Tag, Package, Globe, Phone, Mail, Bell, Search, X, Check,
} from 'lucide-react'

// ─── Icon registry ──────────────────────────────────────────────────────────
export const ICON_GROUPS = [
  {
    group: 'Keuangan',
    icons: [
      { value: 'banknote',          label: 'Uang Tunai',    Icon: Banknote },
      { value: 'wallet',            label: 'Dompet',        Icon: Wallet },
      { value: 'credit-card',       label: 'Kartu Kredit',  Icon: CreditCard },
      { value: 'piggy-bank',        label: 'Tabungan',      Icon: PiggyBank },
      { value: 'trending-up',       label: 'Investasi',     Icon: TrendingUp },
      { value: 'trending-down',     label: 'Pengeluaran',   Icon: TrendingDown },
      { value: 'dollar-sign',       label: 'Pendapatan',    Icon: DollarSign },
      { value: 'coins',             label: 'Koin',          Icon: Coins },
      { value: 'receipt',           label: 'Tagihan',       Icon: Receipt },
      { value: 'hand-coins',        label: 'Transfer',      Icon: HandCoins },
      { value: 'badge-dollar-sign', label: 'Bonus',         Icon: BadgeDollarSign },
      { value: 'landmark',          label: 'Bank',          Icon: Landmark },
    ],
  },
{
  group: 'Belanja & Makanan',
  icons: [
    { value: 'shopping-cart',     label: 'Belanja',       Icon: ShoppingCart },
    { value: 'shopping-bag',      label: 'Tas Belanja',   Icon: ShoppingBag },
    { value: 'store',             label: 'Toko',          Icon: Store },
    { value: 'utensils',          label: 'Makan',         Icon: Utensils },
    { value: 'utensils-crossed',  label: 'Restoran',      Icon: UtensilsCrossed },
    { value: 'coffee',            label: 'Kopi',          Icon: Coffee },
    { value: 'pizza',             label: 'Pizza',         Icon: Pizza },
    { value: 'apple',             label: 'Buah',          Icon: Apple },
    { value: 'wine',              label: 'Minuman',       Icon: Wine },
    { value: 'cake',              label: 'Kue',           Icon: Cake },
    { value: 'soup',              label: 'Sup',           Icon: Soup },
    { value: 'sandwich',          label: 'Makanan Cepat', Icon: Sandwich },
  ],
},
{
  group: 'Transport',
  icons: [
    { value: 'car',              label: 'Mobil',         Icon: Car },
    { value: 'bus',              label: 'Bus',           Icon: Bus },
    { value: 'train',            label: 'Kereta',        Icon: Train },
    { value: 'plane',            label: 'Pesawat',       Icon: Plane },
    { value: 'bike',             label: 'Sepeda',        Icon: Bike },
    { value: 'ship',             label: 'Kapal',         Icon: Ship },
    { value: 'truck',            label: 'Truk',          Icon: Truck },
    { value: 'fuel',             label: 'Bensin',        Icon: Fuel },
    { value: 'parking-circle',   label: 'Parkir',        Icon: ParkingCircle },
    { value: 'map-pin',          label: 'Lokasi',        Icon: MapPin },
  ],
},
{
  group: 'Rumah & Utilitas',
  icons: [
    { value: 'home',             label: 'Rumah',         Icon: Home },
    { value: 'building-2',       label: 'Gedung',        Icon: Building2 },
    { value: 'zap',              label: 'Listrik',       Icon: Zap },
    { value: 'wifi',             label: 'Internet',      Icon: Wifi },
    { value: 'droplets',         label: 'Air',           Icon: Droplets },
    { value: 'flame',            label: 'Gas',           Icon: Flame },
    { value: 'wrench',           label: 'Servis',        Icon: Wrench },
    { value: 'sofa',             label: 'Furnitur',      Icon: Sofa },
    { value: 'key',              label: 'Sewa',          Icon: Key },
    { value: 'tv',               label: 'TV / Streaming',Icon: Tv },
  ],
},
{
  group: 'Kesehatan',
  icons: [
    { value: 'heart-pulse',      label: 'Kesehatan',     Icon: HeartPulse },
    { value: 'pill',             label: 'Obat',          Icon: Pill },
    { value: 'stethoscope',      label: 'Dokter',        Icon: Stethoscope },
    { value: 'activity',         label: 'Aktivitas',     Icon: Activity },
    { value: 'brain',            label: 'Mental',        Icon: Brain },
    { value: 'eye',              label: 'Mata',          Icon: Eye },
    { value: 'smile',            label: 'Perawatan',     Icon: Smile },
    { value: 'baby',             label: 'Anak',          Icon: Baby },
  ],
},
{
  group: 'Pendidikan & Kerja',
  icons: [
    { value: 'book-open',        label: 'Buku',          Icon: BookOpen },
    { value: 'graduation-cap',   label: 'Pendidikan',    Icon: GraduationCap },
    { value: 'briefcase',        label: 'Kerja',         Icon: Briefcase },
    { value: 'laptop',           label: 'Laptop',        Icon: Laptop },
    { value: 'pen-tool',         label: 'Desain',        Icon: PenTool },
    { value: 'library',          label: 'Perpustakaan',  Icon: Library },
    { value: 'school',           label: 'Sekolah',       Icon: School },
    { value: 'monitor',          label: 'Komputer',      Icon: Monitor },
  ],
},
{
  group: 'Hiburan & Lifestyle',
  icons: [
    { value: 'gamepad-2',        label: 'Game',          Icon: Gamepad2 },
    { value: 'music',            label: 'Musik',         Icon: Music },
    { value: 'film',             label: 'Film',          Icon: Film },
    { value: 'camera',           label: 'Foto',          Icon: Camera },
    { value: 'shirt',            label: 'Pakaian',       Icon: Shirt },
    { value: 'scissors',         label: 'Salon',         Icon: Scissors },
    { value: 'dumbbell',         label: 'Gym',           Icon: Dumbbell },
    { value: 'flower-2',         label: 'Kecantikan',    Icon: Flower2 },
    { value: 'gift',             label: 'Hadiah',        Icon: Gift },
    { value: 'party-popper',     label: 'Acara',         Icon: PartyPopper },
    { value: 'sparkles',         label: 'Lux',           Icon: Sparkles },
    { value: 'star',             label: 'Favorit',       Icon: Star },
    { value: 'dog',              label: 'Hewan Peliharaan', Icon: Dog },
    { value: 'cat',              label: 'Kucing',        Icon: Cat },
    { value: 'leaf',             label: 'Lingkungan',    Icon: Leaf },
    { value: 'sun',              label: 'Liburan',       Icon: Sun },
  ],
},
{
  group: 'Lainnya',
  icons: [
    { value: 'tag',              label: 'Label',         Icon: Tag },
    { value: 'package',          label: 'Paket',         Icon: Package },
    { value: 'globe',            label: 'Internet',      Icon: Globe },
    { value: 'phone',            label: 'Telepon',       Icon: Phone },
    { value: 'mail',             label: 'Email',         Icon: Mail },
    { value: 'bell',             label: 'Notifikasi',    Icon: Bell },
    { value: 'more-horizontal',  label: 'Lainnya',       Icon: MoreHorizontal },
  ],
},
]

// Flat list untuk search
const ALL_ICONS = ICON_GROUPS.flatMap(g => g.icons)

export function getCategoryIcon(value: string) {
  return ALL_ICONS.find(i => i.value === value)?.Icon ?? MoreHorizontal
}

// ─── Color palette ───────────────────────────────────────────────────────────
export const CATEGORY_COLORS = [
  { value: '#6366f1', name: 'Indigo' },
{ value: '#8b5cf6', name: 'Violet' },
{ value: '#ec4899', name: 'Pink' },
{ value: '#ef4444', name: 'Merah' },
{ value: '#f97316', name: 'Oranye' },
{ value: '#eab308', name: 'Kuning' },
{ value: '#22c55e', name: 'Hijau' },
{ value: '#14b8a6', name: 'Teal' },
{ value: '#3b82f6', name: 'Biru' },
{ value: '#06b6d4', name: 'Cyan' },
{ value: '#64748b', name: 'Abu' },
{ value: '#a16207', name: 'Coklat' },
]

// ─── Icon Picker subcomponent ─────────────────────────────────────────────────
function IconPicker({ value, color, onChange }: {
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
  ? ICON_GROUPS.filter(g => g.group === activeGroup)
  : ICON_GROUPS

  return (
    <div className="space-y-2">
    {/* Search */}
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

    {/* Group filter pills — hanya tampil saat tidak search */}
    {!query && (
      <div className="flex gap-1.5 flex-wrap">
      <button
      type="button"
      onClick={() => setActiveGroup(null)}
      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        !activeGroup
        ? 'bg-zinc-900 text-white'
        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
      }`}
      >
      Semua
      </button>
      {ICON_GROUPS.map(g => (
        <button
        key={g.group}
        type="button"
        onClick={() => setActiveGroup(g.group === activeGroup ? null : g.group)}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
          activeGroup === g.group
          ? 'bg-zinc-900 text-white'
          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
        }`}
        >
        {g.group}
        </button>
      ))}
      </div>
    )}

    {/* Icon grid */}
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

// ─── Main modal ───────────────────────────────────────────────────────────────
interface Props {
  category?: Category
  onClose: () => void
}

export default function CategoryFormModal({ category, onClose }: Props) {
  const [type, setType] = useState<TransactionType>(category?.type ?? 'expense')
  const [icon, setIcon] = useState(category?.icon ?? 'more-horizontal')
  const [color, setColor] = useState(category?.color ?? '#6366f1')
  const [name, setName] = useState(category?.name ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const SelectedIcon = getCategoryIcon(icon)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('icon', icon)
      formData.set('color', color)
        formData.set('type', type)

          startTransition(async () => {
            const result = category
            ? await updateCategory(category.id, formData)
            : await createCategory(formData)
            if (result?.error) {
              setError(result.error)
              return
            }
            onClose()
          })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

    <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">

    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
    <h2 className="text-base font-semibold text-zinc-900">
    {category ? 'Edit Kategori' : 'Kategori Baru'}
    </h2>
    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
    <X className="w-4 h-4" />
    </button>
    </div>

    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

    {/* Preview + Name */}
    <div className="flex items-center gap-4">
    <div
    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
    style={{ backgroundColor: color + '20' }}
    >
    <SelectedIcon className="w-6 h-6 transition-colors duration-200" style={{ color }} />
    </div>
    <div className="flex-1">
    <input
    name="name"
    type="text"
    required
    value={name}
    onChange={e => setName(e.target.value)}
    placeholder="Nama kategori…"
    maxLength={50}
    className="w-full text-lg font-semibold text-zinc-900 placeholder:text-zinc-300 border-0 border-b-2 border-zinc-100 focus:border-zinc-900 outline-none pb-1.5 transition-colors bg-transparent"
    />
    <p className="text-xs text-zinc-400 mt-1.5">Nama yang mudah dikenali</p>
    </div>
    </div>

    {/* Type */}
    <div className="space-y-2">
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Tipe</label>
    <div className="grid grid-cols-2 gap-2">
    {(['expense', 'income'] as TransactionType[]).map(t => (
      <button
      key={t}
      type="button"
      onClick={() => setType(t)}
      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
        type === t
        ? t === 'expense'
        ? 'border-red-500 bg-red-50 text-red-600'
        : 'border-emerald-500 bg-emerald-50 text-emerald-600'
        : 'border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:text-zinc-600'
      }`}
      >
      {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
      </button>
    ))}
    </div>
    </div>

    {/* Icon picker */}
    <div className="space-y-2">
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Ikon</label>
    <IconPicker value={icon} color={color} onChange={setIcon} />
    </div>

    {/* Color */}
    <div className="space-y-2">
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Warna</label>
    <div className="flex flex-wrap gap-2.5">
    {CATEGORY_COLORS.map(({ value: c, name: cName }) => (
      <button
      key={c}
      type="button"
      onClick={() => setColor(c)}
      title={cName}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
      style={{ backgroundColor: c }}
      >
      {color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </button>
    ))}
    </div>
    </div>

    </div>

    {/* Footer */}
    <div className="px-5 py-4 border-t border-zinc-100 space-y-3">
    {error && (
      <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
    )}
    <div className="flex gap-2.5">
    <button
    type="button"
    onClick={onClose}
    className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
    >
    Batal
    </button>
    <button
    type="submit"
    disabled={isPending || !name.trim()}
    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
    style={{ backgroundColor: color }}
    >
    {isPending ? 'Menyimpan…' : category ? 'Simpan' : 'Buat Kategori'}
    </button>
    </div>
    </div>
    </form>
    </div>
    </div>
  )
}
