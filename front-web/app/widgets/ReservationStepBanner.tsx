import { useLocation } from 'react-router'

const STEPS = [
  { id: 'booking', label: '座席選択', paths: ['/reservations/booking'] },
  { id: 'customer', label: 'お客様情報', paths: ['/reservations/entry', '/reservations/customer'] },
  { id: 'tickets', label: '券種選択', paths: ['/reservations/tickets'] },
  { id: 'payment', label: 'お支払い', paths: ['/reservations/payment'] },
  { id: 'confirm', label: '確認', paths: ['/reservations/confirm'] },
] as const

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function ReservationStepBanner() {
  const location = useLocation()
  const pathname = location.pathname

  const currentStepIndex = STEPS.findIndex((step) => {
    if (step.id === 'booking') {
      return pathname.startsWith('/reservations/booking')
    }
    return step.paths.some((p) => pathname === p)
  })

  if (currentStepIndex === -1) return null

  return (
    <div className="bg-background border-b border-border py-4">
      <div className="container-center px-4">
        {/* Mobile View */}
        <div className="flex flex-col gap-2 md:hidden">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Step {currentStepIndex + 1} / {STEPS.length}</span>
            <span className="text-primary font-black">{Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-700 ease-in-out"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight">{STEPS[currentStepIndex].label}</span>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between relative max-w-4xl mx-auto px-4">
          {/* Progress Line Background */}
          <div className="absolute top-[15px] left-0 w-full h-0.5 bg-muted z-0" />

          {/* Active Progress Line */}
          <div
            className="absolute top-[15px] left-0 h-0.5 bg-primary transition-all duration-700 ease-in-out z-0"
            style={{
              width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
            }}
          />

          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isFuture = index > currentStepIndex

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground shadow-md' : ''}
                    ${isCurrent ? 'bg-background border-primary text-primary ring-4 ring-primary/10 scale-110 shadow-lg shadow-primary/20' : ''}
                    ${isFuture ? 'bg-background border-muted text-muted-foreground' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-black">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    text-[10px] lg:text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-500
                    ${isCompleted ? 'text-muted-foreground' : ''}
                    ${isCurrent ? 'text-primary scale-105' : ''}
                    ${isFuture ? 'text-muted-foreground/40' : ''}
                  `}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
