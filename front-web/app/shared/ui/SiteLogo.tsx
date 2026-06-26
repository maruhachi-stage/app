import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"
import { useThemeContext } from "~/shared/lib/theme"

type Props = {
  imgClassName?: string
  onClick?: () => void
}

export function SiteLogo({ imgClassName = "h-10 w-auto md:h-14", onClick }: Props) {
  const { theme } = useThemeContext()
  const src = theme === "dark" ? AppConfig.logoDarkUrl : AppConfig.logoLightUrl

  return (
    <Link to="/" onClick={onClick} className="inline-flex shrink-0">
      <img src={src} alt={AppConfig.name} className={imgClassName} />
    </Link>
  )
}
