import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Syarat & Ketentuan',
    description: 'Syarat dan ketentuan penggunaan Dompetin.',
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-zinc-200 p-8 space-y-8">
        <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Syarat & Ketentuan</h1>
        <p className="text-sm text-zinc-400 mt-1">Terakhir diperbarui: 11 Juli 2026</p>
        </div>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">1. Penerimaan Ketentuan</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Dengan membuat akun dan menggunakan Dompetin, kamu setuju untuk terikat dengan syarat dan
        ketentuan berikut. Jika kamu tidak setuju, mohon untuk tidak menggunakan layanan ini.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">2. Deskripsi Layanan</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Dompetin adalah aplikasi pencatatan keuangan pribadi yang membantu kamu mencatat
        transaksi, mengelola dompet/akun, dan menetapkan target tabungan. Layanan ini disediakan
        "sebagaimana adanya" tanpa jaminan bebas dari kesalahan.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">3. Akun Pengguna</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Kamu bertanggung jawab menjaga kerahasiaan kredensial akunmu. Segala aktivitas yang
        terjadi di bawah akunmu menjadi tanggung jawabmu, kecuali jika terbukti disebabkan oleh
        kelalaian sistem kami.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">4. Bukan Nasihat Keuangan</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Dompetin adalah alat pencatatan, bukan penasihat keuangan berlisensi. Keputusan keuangan
        yang kamu ambil berdasarkan data di aplikasi ini sepenuhnya menjadi tanggung jawabmu
        sendiri.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">5. Batasan Tanggung Jawab</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Kami tidak bertanggung jawab atas kehilangan data akibat force majeure, gangguan pihak
        ketiga (mis. penyedia layanan cloud), atau kesalahan input dari pengguna sendiri. Kami
        menyarankan pengguna rutin melakukan backup data melalui fitur Ekspor yang tersedia.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">6. Perubahan Layanan</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Kami berhak mengubah, menangguhkan, atau menghentikan sebagian maupun seluruh fitur
        Dompetin kapan pun, dengan atau tanpa pemberitahuan sebelumnya.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">7. Kontak</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Pertanyaan seputar ketentuan ini bisa dikirim ke{' '}
        <a href="mailto:raehanramadhanq1@gmail.com" className="text-zinc-900 underline">
        raehanramadhanq1@gmail.com
        </a>
        .
        </p>
        </section>
        </div>
        </div>
    )
}
