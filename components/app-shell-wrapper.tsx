"use client"

import { Suspense } from "react"
import { AppShell } from "./app-shell"

export function AppShellWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        {children}
      </Suspense>
    </AppShell>
  )
}

