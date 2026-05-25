import type { Movie } from "~/entities/movie/types";
import { MovieGridCard, MovieListCard } from "~/widgets/MovieCard";
import TimetableView from "~/features/movie/components/TimetableView";

type Props = {
  movies: Movie[];
  selectedDate: string;
  loading: boolean;
  view: "grid" | "list" | "timetable";
  error?: string;
};

export function MovieGrid({ movies, selectedDate, loading, view, error }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground font-medium">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 p-4 text-center text-red-500 font-medium border border-red-500/20">
        {error}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="rounded-app border-2 border-dashed border-border py-20 text-center">
        <p className="text-muted-foreground font-medium">
          {selectedDate ? "選択した日の上映はありません。" : "該当する映画が見つかりません。"}
        </p>
      </div>
    );
  }

  if (view === "timetable") {
    return <TimetableView movies={movies} selectedDate={selectedDate} />;
  }

  if (view === "list") {
    return (
      <div className="flex flex-col gap-4">
        {movies.map((movie) => (
          <MovieListCard key={movie.id} movie={movie} selectedDate={selectedDate} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieGridCard key={movie.id} movie={movie} selectedDate={selectedDate} />
      ))}
    </div>
  );
}
