import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { PageLoader } from "@/components/page-loader"

const HandoffsContent = dynamic(() => import("@/components/handoffs-content").then(mod => ({ default: mod.HandoffsContent })), {
  loading: () => <PageLoader />
})

export default function HandoffsPage() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <HandoffsContent />
      </Suspense>
    </AppShell>
  )
}
