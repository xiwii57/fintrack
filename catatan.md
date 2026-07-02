src/actions/auth.ts — logika signup/login, validasi input
src/actions/transaction.ts — CRUD transaksi, cek ownership check per query
src/actions/category.ts — CRUD kategori, cek ownership check
src/actions/report.ts — export data, cek akses
src/lib/rate-limit.ts — implementasi rate limiting, cek apakah in-memory (hilang saat restart/scale) atau persistent
src/lib/supabase/client.ts — pastikan tidak ada key yang salah expose
SQL policies RLS lengkap untuk tabel profiles, categories, transactions (bukan cuma storage yang sudah kamu kirim)


src/app/(dashboard)/dashboard/page.tsx — server component pemanggil getDashboardData().
src/app/(dashboard)/dashboard/dashboard-client.tsx — kamu sempat share potongannya di awal chat ini (soal Tooltip formatter), tapi belum full file-nya.
src/app/(dashboard)/reports/page.tsx — pemanggil getReportData(), cek apakah startDate/endDate dari query param divalidasi sebelum masuk query Supabase.
src/app/(dashboard)/settings/page.tsx — cek pemanggilan getProfile().
src/app/(dashboard)/transactions/page.tsx — cek pemanggilan getTransactions()/getCategories().
src/app/page.tsx dan src/app/layout.tsx — root page & layout, cek apakah ada logic auth/redirect di sini juga.
src/lib/utils.ts — biasanya cuma helper (cn()), tapi cek untuk memastikan.
src/components/ui/button.tsx — kemungkinan besar aman, tapi belum dicek.
