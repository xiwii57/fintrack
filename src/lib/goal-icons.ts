import {
    Target, PiggyBank, Home, Car, Plane, GraduationCap,
    Heart, Gift, Laptop, Smartphone, Briefcase, Baby,
    Dumbbell, Camera, Gem, Umbrella, MoreHorizontal,
} from 'lucide-react'

export const GOAL_ICON_GROUPS = [
    {
        group: 'Umum',
        icons: [
            { value: 'target',     label: 'Target',    Icon: Target },
            { value: 'piggy-bank', label: 'Tabungan',  Icon: PiggyBank },
            { value: 'gift',       label: 'Hadiah',    Icon: Gift },
            { value: 'umbrella',   label: 'Dana Darurat', Icon: Umbrella },
        ],
    },
{
    group: 'Properti & Kendaraan',
    icons: [
        { value: 'home', label: 'Rumah',   Icon: Home },
        { value: 'car',  label: 'Mobil',   Icon: Car },
    ],
},
{
    group: 'Hidup & Karir',
    icons: [
        { value: 'graduation-cap', label: 'Pendidikan', Icon: GraduationCap },
        { value: 'briefcase',      label: 'Bisnis',     Icon: Briefcase },
        { value: 'baby',           label: 'Anak',       Icon: Baby },
        { value: 'heart',          label: 'Pernikahan', Icon: Heart },
        { value: 'ring', label: 'Cincin', Icon: Gem },
    ],
},
{
    group: 'Gaya Hidup',
    icons: [
        { value: 'plane',      label: 'Liburan',   Icon: Plane },
        { value: 'laptop',     label: 'Gadget',    Icon: Laptop },
        { value: 'smartphone', label: 'HP',        Icon: Smartphone },
        { value: 'camera',     label: 'Kamera',    Icon: Camera },
        { value: 'dumbbell',   label: 'Kebugaran', Icon: Dumbbell },
    ],
},
]

const ALL_GOAL_ICONS = GOAL_ICON_GROUPS.flatMap(g => g.icons)

export function getGoalIcon(value: string) {
    return ALL_GOAL_ICONS.find(i => i.value === value)?.Icon ?? MoreHorizontal
}

export const GOAL_COLORS = [
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
