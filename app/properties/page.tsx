import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { PageLoader } from "@/components/page-loader"

const PropertiesContent = dynamic(() => import("@/components/properties-content").then(mod => ({ default: mod.PropertiesContent })), {
  loading: () => <PageLoader />
})

export default function PropertiesPage() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <PropertiesContent />
      </Suspense>
    </AppShell>
  )
}
