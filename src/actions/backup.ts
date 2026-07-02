// src/actions/backup.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import type { TransactionType } from '@/types'

const BACKUP_VERSION = 1
const MAX_TRANSACTIONS = 50_000 // guard terhadap payload abusif
const MAX_CATEGORIES = 1_000
const INSERT_BATCH_SIZE = 500
const DESCRIPTION_MAX_LENGTH = 100

interface BackupCategory {
    name: string
    icon: string
    color: string
    type: TransactionType
}

interface BackupTransaction {
    type: TransactionType
    amount: number
    description: string
    date: string
    category: string | null // nama kategori, bukan ID
}

interface BackupFile {
    version: number
    exported_at: string
    categories: BackupCategory[]
    transactions: BackupTransaction[]
}

interface ImportResult {
    categories: number // jumlah kategori baru dibuat
    transactions: number // jumlah transaksi baru dimasukkan
}

type ExportResult =
| { success: true; data: BackupFile }
| { success: false; error: string }

type ImportResponse =
| { success: true; imported: ImportResult }
| { success: false; error: string }

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<ExportResult> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const [{ data: categories, error: catError }, { data: transactions, error: txError }] =
    await Promise.all([
        supabase
        .from('categories')
        .select('name, icon, color, type')
        .eq('user_id', user.id),
                      supabase
                      .from('transactions')
                      .select('type, amount, description, date, category:categories(name)')
                      .eq('user_id', user.id),
    ])

    if (catError || txError) {
        return { success: false, error: 'Gagal mengambil data' }
    }

    const backup: BackupFile = {
        version: BACKUP_VERSION,
        exported_at: new Date().toISOString(),
        categories: (categories ?? []).map((c) => ({
            name: c.name,
            icon: c.icon,
            color: c.color,
            type: c.type as TransactionType,
        })),
        transactions: (transactions ?? []).map((t) => ({
            type: t.type as TransactionType,
            amount: t.amount,
            description: t.description,
            date: t.date,
            // relasi single-object dari Supabase join bisa berupa object atau array tergantung versi client
            category: Array.isArray(t.category)
            ? t.category[0]?.name ?? null
            : (t.category as { name: string } | null)?.name ?? null,
        })),
    }

    return { success: true, data: backup }
}

// ─────────────────────────────────────────────────────────────
// VALIDATION (fail fast, sebelum query apapun ke DB)
// ─────────────────────────────────────────────────────────────

function validateBackup(raw: unknown): BackupFile {
    if (typeof raw !== 'object' || raw === null) {
        throw new Error('File backup tidak valid')
    }

    const obj = raw as Record<string, unknown>

    if (typeof obj.version !== 'number') {
        throw new Error('File backup tidak valid: field version hilang')
    }
    if (obj.version !== BACKUP_VERSION) {
        throw new Error(`Versi backup tidak didukung: ${obj.version}`)
    }
    if (!Array.isArray(obj.categories)) {
        throw new Error('File backup tidak valid: categories harus berupa array')
    }
    if (!Array.isArray(obj.transactions)) {
        throw new Error('File backup tidak valid: transactions harus berupa array')
    }
    if (obj.categories.length > MAX_CATEGORIES) {
        throw new Error(`Terlalu banyak kategori (maks ${MAX_CATEGORIES})`)
    }
    if (obj.transactions.length > MAX_TRANSACTIONS) {
        throw new Error(`Terlalu banyak transaksi (maks ${MAX_TRANSACTIONS})`)
    }

    const categories: BackupCategory[] = obj.categories.map((c, i) => {
        if (typeof c !== 'object' || c === null) {
            throw new Error(`Kategori index ${i} tidak valid`)
        }
        const cat = c as Record<string, unknown>
        if (typeof cat.name !== 'string' || cat.name.trim() === '') {
            throw new Error(`Kategori index ${i}: name wajib diisi`)
        }
        if (cat.type !== 'income' && cat.type !== 'expense') {
            throw new Error(`Kategori index ${i}: type harus income/expense`)
        }
        return {
            name: cat.name.trim(),
                                                            icon: typeof cat.icon === 'string' && cat.icon ? cat.icon : 'circle',
                                                            color: typeof cat.color === 'string' && cat.color ? cat.color : '#6366f1',
                                                            type: cat.type,
        }
    })

    const transactions: BackupTransaction[] = obj.transactions.map((t, i) => {
        if (typeof t !== 'object' || t === null) {
            throw new Error(`Transaksi index ${i} tidak valid`)
        }
        const tx = t as Record<string, unknown>
        if (tx.type !== 'income' && tx.type !== 'expense') {
            throw new Error(`Transaksi index ${i}: type harus income/expense`)
        }
        if (typeof tx.amount !== 'number' || !Number.isFinite(tx.amount) || tx.amount <= 0) {
            throw new Error(`Transaksi index ${i}: amount harus angka > 0`)
        }
        if (typeof tx.date !== 'string' || Number.isNaN(Date.parse(tx.date))) {
            throw new Error(`Transaksi index ${i}: date tidak valid`)
        }
        if (tx.category !== null && typeof tx.category !== 'string') {
            throw new Error(`Transaksi index ${i}: category harus string atau null`)
        }

        return {
            type: tx.type,
            amount: tx.amount,
            description:
            typeof tx.description === 'string'
    ? tx.description.slice(0, DESCRIPTION_MAX_LENGTH)
    : '',
    date: tx.date,
    category: tx.category ?? null,
        }
    })

    return {
        version: obj.version,
        exported_at: typeof obj.exported_at === 'string' ? obj.exported_at : new Date().toISOString(),
        categories,
        transactions,
    }
}

// ─────────────────────────────────────────────────────────────
// IMPORT
// ─────────────────────────────────────────────────────────────

export async function importBackup(fileContent: string): Promise<ImportResponse> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // 1. Validasi struktur sebelum menyentuh DB
    let backup: BackupFile
    try {
        const parsed = JSON.parse(fileContent)
        backup = validateBackup(parsed)
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : 'File backup tidak dapat dibaca',
        }
    }

    // 2. Ambil kategori existing milik user (untuk dedup by name+type)
    const { data: existingCategories, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, type')
    .eq('user_id', user.id)

    if (fetchError) {
        return { success: false, error: 'Gagal membaca kategori yang ada' }
    }

    const categoryMap = new Map<string, string>() // key: `${name}|${type}` -> id
    for (const c of existingCategories ?? []) {
        categoryMap.set(`${c.name}|${c.type}`, c.id)
    }

    // 3. Insert kategori baru yang belum ada
    const newCategories = backup.categories.filter(
        (c) => !categoryMap.has(`${c.name}|${c.type}`)
    )

    if (newCategories.length > 0) {
        const { data: inserted, error: insertCatError } = await supabase
        .from('categories')
        .insert(
            newCategories.map((c) => ({
                user_id: user.id, // selalu dari sesi, bukan dari file
                name: c.name,
                icon: c.icon,
                color: c.color,
                type: c.type,
            }))
        )
        .select('id, name, type')

        if (insertCatError) {
            return { success: false, error: 'Gagal membuat kategori baru' }
        }

        for (const c of inserted ?? []) {
            categoryMap.set(`${c.name}|${c.type}`, c.id)
        }
    }

    // 4. Insert transaksi (selalu tambah, per-batch 500)
    const rows = backup.transactions.map((t) => ({
        user_id: user.id, // selalu dari sesi, bukan dari file
        category_id: t.category ? categoryMap.get(`${t.category}|${t.type}`) ?? null : null,
                                                 type: t.type,
                                                 amount: t.amount,
                                                 description: t.description,
                                                 date: t.date,
    }))

    for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
        const batch = rows.slice(i, i + INSERT_BATCH_SIZE)
        const { error: insertTxError } = await supabase.from('transactions').insert(batch)
        if (insertTxError) {
            return {
                success: false,
                error: `Gagal memasukkan transaksi (batch ${i / INSERT_BATCH_SIZE + 1}): ${insertTxError.message}`,
            }
        }
    }

    return {
        success: true,
        imported: {
            categories: newCategories.length,
            transactions: rows.length,
        },
    }
}
