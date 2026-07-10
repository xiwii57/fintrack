import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Kebijakan Privasi',
    description: 'Kebijakan privasi Dompetin — bagaimana kami mengelola data kamu.',
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-zinc-200 p-8 space-y-8">
        <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Kebijakan Privasi</h1>
        <p className="text-sm text-zinc-400 mt-1">Terakhir diperbarui: 11 Juli 2026</p>
        </div>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">1. Pendahuluan</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Dompetin ("kami") adalah aplikasi pencatatan keuangan pribadi. Kebijakan ini menjelaskan
        data apa saja yang kami kumpulkan, bagaimana data itu digunakan, dan hak kamu sebagai
        pengguna. Dengan menggunakan Dompetin, kamu menyetujui praktik yang dijelaskan di sini.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">2. Data yang Kami Kumpulkan</h2>
        <ul className="text-sm text-zinc-600 leading-relaxed list-disc pl-5 space-y-1">
        <li>Informasi akun: nama, alamat email, dan foto profil (jika masuk lewat Google)</li>
        <li>Data keuangan yang kamu input sendiri: transaksi, dompet, kategori, dan target tabungan</li>
        <li>Data teknis: alamat IP dan informasi perangkat, digunakan untuk keamanan (mis. rate limiting dan pencegahan penyalahgunaan)</li>
        </ul>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">3. Bagaimana Data Digunakan</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Data yang kamu masukkan digunakan semata-mata untuk menyediakan fitur pencatatan keuangan
        di dalam akunmu sendiri. Kami tidak menjual atau membagikan data keuanganmu kepada pihak
        ketiga untuk kepentingan periklanan.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">4. Penyimpanan & Pihak Ketiga</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Data disimpan menggunakan Supabase (infrastruktur database dan autentikasi) dan Upstash
        (untuk rate limiting keamanan). Jika kamu masuk menggunakan Google, kami hanya menerima
        nama, email, dan foto profil dasar sesuai izin yang kamu berikan — kami tidak mengakses
        data Google lain di luar itu.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">5. Keamanan</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Kami menerapkan enkripsi saat transit (HTTPS), kebijakan akses berbasis baris (row-level
        security) di database, dan pembatasan permintaan (rate limiting) untuk mencegah akses
        tidak sah ke akunmu.
        </p>
        </section>

        <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-800">6. Hak Kamu</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
        Sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP), kamu berhak mengakses,
            memperbarui, atau menghapus data pribadimu kapan saja melalui halaman Pengaturan, atau
            dengan menghubungi kami di email di bawah.
            </p>
            </section>

            <section className="space-y-2">
            <h2 className="text-base font-medium text-zinc-800">7. Kontak</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
            Ada pertanyaan seputar privasi? Hubungi kami di{' '}
            <a href="mailto:raehanramadhanq1@gmail.com.com" className="text-zinc-900 underline">
            raehanramadhanq1@gmail.com
            </a>
            .
            </p>
            </section>
            </div>
            </div>
    )
}
