'use client'

import { useRef, useState } from 'react'
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { exportBackup, importBackup } from '@/actions/backup'

type Status =
| { state: 'idle' }
| { state: 'exporting' }
| { state: 'importing' }
| { state: 'success'; message: string }
| { state: 'error'; message: string }

export default function BackupRestore() {
    const [status, setStatus] = useState<Status>({ state: 'idle' })
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleExport() {
        setStatus({ state: 'exporting' })
        const result = await exportBackup()

        if (!result.success) {
            setStatus({ state: 'error', message: result.error })
            return
        }

        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
            type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dompetin-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)

        setStatus({ state: 'success', message: 'Backup berhasil diunduh.' })
    }

    function handlePickFile() {
        fileInputRef.current?.click()
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        e.target.value = '' // reset supaya file yang sama bisa dipilih ulang
        if (!file) return

            const confirmed = window.confirm(
                'Restore akan MENAMBAHKAN data dari file ini ke data yang sudah ada (bukan menimpa). Lanjutkan?'
            )
            if (!confirmed) return

                setStatus({ state: 'importing' })

                try {
                    const content = await file.text()
                    const result = await importBackup(content)

                    if (!result.success) {
                        setStatus({ state: 'error', message: result.error })
                        return
                    }

                    setStatus({
                        state: 'success',
                        message: `Berhasil memulihkan ${result.imported.categories} kategori baru dan ${result.imported.transactions} transaksi.`,
                    })
                } catch {
                    setStatus({ state: 'error', message: 'Gagal membaca file. Pastikan file berupa JSON valid.' })
                }
    }

    const isBusy = status.state === 'exporting' || status.state === 'importing'

    return (
        <div className="px-6 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
        <button
        onClick={handleExport}
        disabled={isBusy}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
        {status.state === 'exporting' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
            <Download className="w-4 h-4" />
        )}
        Backup Data
        </button>

        <button
        onClick={handlePickFile}
        disabled={isBusy}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
        {status.state === 'importing' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
            <Upload className="w-4 h-4" />
        )}
        Restore dari File
        </button>

        <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        className="hidden"
        />
        </div>

        <p className="text-xs text-zinc-400">
        Backup mencakup kategori dan transaksi. Restore bersifat gabung — data lama tidak akan hilang atau tertimpa.
        </p>

        {status.state === 'success' && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{status.message}</span>
            </div>
        )}

        {status.state === 'error' && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{status.message}</span>
            </div>
        )}
        </div>
    )
}
