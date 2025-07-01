import { Badge } from '@/components/ui/badge'

export default function Header() {
  return (
    <header className="border-b bg-background" role="banner">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center" role="img" aria-label="GXO Signify logo">
              <span className="text-primary-foreground font-bold text-sm" aria-hidden="true">GS</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">GXO × Signify</h1>
              <p className="text-xs text-muted-foreground">Forecasting Platform</p>
            </div>
          </div>
        </div>
        
        <div className="ml-auto">
          <Badge variant="outline" className="text-xs" role="status" aria-label="Current environment: Pilot">
            Pilot Environment
          </Badge>
        </div>
      </div>
    </header>
  )
}