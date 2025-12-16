import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { PageLoader } from "@/components/page-loader"

const AppointmentsContent = dynamic(() => import("@/components/appointments-content").then(mod => ({ default: mod.AppointmentsContent })), {
  loading: () => <PageLoader />
})

export default function AppointmentsPage() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <AppointmentsContent />
      </Suspense>
    </AppShell>
  )
}
