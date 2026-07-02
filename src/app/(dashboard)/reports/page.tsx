// app/(dashboard/reports/page.tsx)
import { getReportData } from '@/actions/report'
import ReportsClient from '@/components/features/reports/reports-client'

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))
}

// Default: bulan ini
function getDefaultRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  .toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  .toISOString().slice(0, 10)
  return { start, end }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>
}) {
  const { start: defaultStart, end: defaultEnd } = getDefaultRange()
  const params = await searchParams // unwrap dulu

  const start = params.start && isValidDate(params.start) ? params.start : defaultStart
  const end = params.end && isValidDate(params.end) ? params.end : defaultEnd

  const { data, error } = await getReportData(start, end)

  return (
    <ReportsClient
    initialData={data}
    initialStart={start}
    initialEnd={end}
    error={error}
    />
  )
}
