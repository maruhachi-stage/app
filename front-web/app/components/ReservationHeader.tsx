import { SiteLogo } from '~/components/SiteLogo'
import { HoldTimer } from './HoldTimer'

export function ReservationHeader() {
    return (
        <header className="bg-background/80 backdrop-blur-md border-b border-border z-50 sticky top-0">
            <div className="py-4">
                <div className="container-center flex items-center justify-between">
                    <SiteLogo />

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
