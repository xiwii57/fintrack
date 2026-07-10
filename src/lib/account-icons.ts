import {
    Wallet, Banknote, Landmark, Building2, CreditCard,
    PiggyBank, Smartphone, Coins, TrendingUp, Bitcoin,
    BadgeDollarSign, HandCoins, MoreHorizontal,
} from 'lucide-react'

export const ACCOUNT_ICON_GROUPS = [
    {
        group: 'Bank & Kartu',
        icons: [
            { value: 'landmark',    label: 'Bank',          Icon: Landmark },
            { value: 'building-2',  label: 'Rekening',      Icon: Building2 },
            { value: 'credit-card', label: 'Kartu Kredit',  Icon: CreditCard },
        ],
    },
{
    group: 'Tunai & Digital',
    icons: [
        { value: 'wallet',      label: 'Dompet',        Icon: Wallet },
        { value: 'banknote',    label: 'Tunai',         Icon: Banknote },
        { value: 'smartphone',  label: 'E-Wallet',      Icon: Smartphone },
        { value: 'coins',       label: 'Koin',          Icon: Coins },
    ],
},
{
    group: 'Simpanan & Investasi',
    icons: [
        { value: 'piggy-bank',        label: 'Tabungan',   Icon: PiggyBank },
        { value: 'trending-up',       label: 'Investasi',  Icon: TrendingUp },
        { value: 'bitcoin',           label: 'Kripto',     Icon: Bitcoin },
        { value: 'badge-dollar-sign', label: 'Deposito',   Icon: BadgeDollarSign },
        { value: 'hand-coins',        label: 'Piutang',    Icon: HandCoins },
    ],
},
]

const ALL_ACCOUNT_ICONS = ACCOUNT_ICON_GROUPS.flatMap(g => g.icons)

export function getAccountIcon(value: string) {
    return ALL_ACCOUNT_ICONS.find(i => i.value === value)?.Icon ?? MoreHorizontal
}

// Palet sama seperti kategori, disalin (bukan di-import) supaya dompet
// dan kategori bisa berkembang independen tanpa saling mempengaruhi
export const ACCOUNT_COLORS = [
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
