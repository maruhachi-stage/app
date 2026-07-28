import { Link } from "react-router"
import type { Screening } from "~/features/screening/domain/screening"
import { AppConfig } from "~/config/app"
import { proxyImageUrl } from "~/lib/image"

type Props = {
	movies: Screening[]
	loading: boolean
	error: string
}

function movieImageUrl(thumbnailUrl: string | null): string | null {
	return proxyImageUrl(thumbnailUrl) ?? null
}

function movieDetailPath(movieId: number): string {
	return `/screenings/${movieId}?type=movie`
}

function moviesListPath(params?: { status?: string; date?: string }): string {
	const qs = new URLSearchParams({ type: "movie" })
	if (params?.status) qs.set("status", params.status)
	if (params?.date) qs.set("date", params.date)
	return `/screenings?${qs.toString()}`
}

function HeroMain({ movie }: { movie: Screening }) {
	const imgUrl = movieImageUrl(movie.thumbnailUrl)
	return (
		<Link
			to={movieDetailPath(movie.id)}
			className="relative block overflow-hidden rounded-lg col-span-1 row-span-2 group bg-black h-full"
		>
			{imgUrl ? (
				<>
					<img
						src={imgUrl}
						alt=""
						className="hidden sm:block absolute inset-0 h-full w-full object-cover scale-110 blur-xl opacity-60"
					/>
					<img
						src={imgUrl}
						alt={movie.title}
						className="relative h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
					/>
				</>
			) : (
				<div className="h-full w-full bg-muted flex items-center justify-center">
					<span className="text-muted-foreground text-sm">No Image</span>
				</div>
			)}

			<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
			<div className="absolute bottom-0 left-0 right-0 p-6">
				<span className="inline-block bg-primary text-primary-foreground text-[11px] font-bold tracking-widest px-2.5 py-1 rounded-sm mb-3">上映中</span>
				<h2 className="text-2xl font-bold leading-snug text-white drop-shadow-lg mb-2">{movie.title}</h2>
				<p className="text-white/70 text-xs mb-4 line-clamp-2">{movie.description}</p>
				<span className="inline-flex items-center gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded transition-colors">▶ 予約する</span>
			</div>
		</Link>
	)
}

function HeroSub({ movie }: { movie: Screening }) {
	const imgUrl = movieImageUrl(movie.thumbnailUrl)
	return (
		<Link to={movieDetailPath(movie.id)} className="relative block overflow-hidden rounded-lg group aspect-square sm:aspect-auto">
			{imgUrl ? (
				<>
					<img
						src={imgUrl}
						alt=""
						className="absolute inset-0 h-full w-full object-cover scale-110 blur-xl opacity-60"
					/>
					<img
						src={imgUrl}
						alt={movie.title}
						className="relative h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
					/>
				</>
			) : (
				<div className="h-full w-full bg-muted flex items-center justify-center">
					<span className="text-muted-foreground text-sm">No Image</span>
				</div>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
			<div className="absolute bottom-0 left-0 right-0 p-5">
				<span className="inline-block text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm mb-2 bg-primary/80 text-primary-foreground">上映中</span>
				<h3 className="text-base font-bold leading-snug text-white drop-shadow-lg line-clamp-2">{movie.title}</h3>
				<p className="text-white/60 text-xs mt-1">{movie.durationMin}分</p>
			</div>
		</Link>
	)
}

function HeroSkeleton() {
	return (
		<div className="grid grid-cols-2 grid-rows-2 gap-4 h-[520px] animate-pulse">
			<div className="col-span-1 row-span-2 rounded-lg bg-muted" />
			<div className="rounded-lg bg-muted" />
			<div className="rounded-lg bg-muted" />
		</div>
	)
}

export function HomeNowShowingSection({ movies, loading, error }: Props) {
	const nowShowing = movies.filter(m => m.status === "now_showing")
	const [heroMain, ...heroRest] = nowShowing
	const heroSubs = heroRest.slice(0, 2)

	return (
		<section>
			<div className="flex items-center gap-3 mb-6">
				<span className="w-1 h-5 bg-primary rounded-full" />
				<h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Now Showing</h2>
				<Link to={moviesListPath({ status: "now_showing" })} className="ml-auto text-xs text-primary hover:underline">
					すべての作品を見る →
				</Link>
			</div>

			{loading && <HeroSkeleton />}
			{error && (
				<div className="h-[200px] flex items-center justify-center rounded-lg bg-muted border border-border">
					<p className="text-muted-foreground text-sm">{error}</p>
				</div>
			)}
			{!loading && !error && nowShowing.length === 0 && (
				<div className="py-16 text-center space-y-4">
					<h1 className="text-4xl font-bold">{AppConfig.name}へようこそ</h1>
					<p className="text-lg text-muted-foreground">上映中の映画をチェックして、座席を予約しましょう。</p>
					<Link to={moviesListPath()} className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-bold text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
						映画一覧を見る
					</Link>
				</div>
			)}
			{!loading && !error && heroMain && (
				<div className="grid grid-cols-[3fr_2fr] gap-4 sm:grid-rows-2 sm:h-[520px]">
					<HeroMain movie={heroMain} />
					{heroSubs.map(m => <HeroSub key={m.id} movie={m} />)}
				</div>
			)}
		</section>
	)
}
