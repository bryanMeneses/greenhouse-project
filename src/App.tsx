import { ArrowRight } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <AppShell title="Dashboard">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <p className="text-sm font-medium text-primary">Foundation ready</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            The preparer workspace shell
          </h2>
          <p className="mt-3 text-muted-foreground">
            Design system, fonts, and test harness are wired up. Returns, source traceability,
            trust signals, and the actionable dashboard build on top of this.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button>
              Open a return
              <ArrowRight />
            </Button>
            <Button variant="outline">View review queue</Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default App
