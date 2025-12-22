import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { PageLoader } from "@/components/page-loader"

const DashboardContent = dynamic(() => import("@/components/dashboard-content").then(mod => ({ default: mod.DashboardContent })), {
  loading: () => <PageLoader />
})

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <DashboardContent />
      </Suspense>
    </AppShell>
  )
}
