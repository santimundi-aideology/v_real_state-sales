import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { PageLoader } from "@/components/page-loader"

const ConversationsContent = dynamic(() => import("@/components/conversations-content").then(mod => ({ default: mod.ConversationsContent })), {
  loading: () => <PageLoader />
})

export default function ConversationsPage() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <ConversationsContent />
      </Suspense>
    </AppShell>
  )
}
