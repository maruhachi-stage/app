import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"
import { HoldTimer } from "./HoldTimer"

export function ReservationHeader() {
  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border z-50 sticky top-0">
      <div className="py-4">
        <div className="container-center flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
            {AppConfig.name}
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest border border-muted-foreground/30 px-2 py-1 rounded">
              Reservation Flow
            </span>
          </div>
        </div>
      </div>
      <HoldTimer />
    </header>
  )
}
