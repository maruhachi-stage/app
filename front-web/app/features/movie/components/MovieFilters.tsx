type Props = {
    selectedStatus: string;
    selectedDate: string;
    sortBy: 'newest' | 'title' | 'duration';
    view: 'grid' | 'list' | 'timetable';
    onStatusChange: (status: string) => void;
    onSortChange: (sort: 'newest' | 'title' | 'duration') => void;
    onViewChange: (v: 'grid' | 'list' | 'timetable') => void;
    onClearAll: () => void;
};

export function MovieFilters({
    selectedStatus,
    selectedDate,
    sortBy,
    view,
    onStatusChange,
    onSortChange,
    onViewChange,
    onClearAll
}: Props) {
    return (
        <div className='mb-8 flex flex-col gap-3'>
            {/* 上段: ステータスフィルター + ソート */}
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
                <div className='flex items-center gap-2'>
                    <button
                        onClick={onClearAll}
                        className={`rounded-full px-4 py-1.5 text-sm font-bold transition border ${
                            selectedStatus === '' && selectedDate === ''
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
                        }`}
                    >
                        すべて
                    </button>
                    <button
                        onClick={() => onStatusChange('now_showing')}
                        className={`rounded-full px-4 py-1.5 text-sm font-bold transition border ${
                            selectedStatus === 'now_showing'
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
                        }`}
                    >
                        上映中
                    </button>
                    <button
                        onClick={() => onStatusChange('coming_soon')}
                        className={`rounded-full px-4 py-1.5 text-sm font-bold transition border ${
                            selectedStatus === 'coming_soon'
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
                        }`}
                    >
                        上映予定
                    </button>
                </div>

                <div className='hidden sm:block flex-1'/>

                <div className='flex items-center gap-3 text-sm'>
                    <span className='hidden sm:inline text-muted-foreground font-bold'>並べ替え:</span>
                    <div className='flex items-center gap-3'>
                        <button
                            onClick={() => onSortChange('newest')}
                            className={`transition ${sortBy === 'newest' ? 'text-primary font-bold underline underline-offset-4' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            新着順
                        </button>
                        <button
                            onClick={() => onSortChange('title')}
                            className={`transition ${sortBy === 'title' ? 'text-primary font-bold underline underline-offset-4' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            タイトル順
                        </button>
                        <button
                            onClick={() => onSortChange('duration')}
                            className={`transition ${sortBy === 'duration' ? 'text-primary font-bold underline underline-offset-4' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            上映時間順
                        </button>
                    </div>
                </div>
            </div>

            {/* 下段: 検索ボックス + 表示切替 */}
            <div className='flex items-center gap-3 rounded-xl bg-muted/60 p-3 sm:p-4 border border-border'>
                <div className='relative flex-1 flex items-center'>
                    <div className='flex items-center rounded-lg border border-border bg-background px-4 py-2 w-full focus-within:ring-1 focus-within:ring-primary transition-all'>
                        <svg className='mr-2 h-4 w-4 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/>
                        </svg>
                        <input
                            type='text'
                            placeholder='検索'
                            className='bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground w-full'
                        />
                    </div>
                </div>

                <div className='flex items-center gap-1 rounded-lg bg-background p-1 border border-border'>
                    <button onClick={() => onViewChange('grid')} className={`rounded-md p-1.5 transition ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z'/></svg>
                    </button>
                    <button onClick={() => onViewChange('list')} className={`rounded-md p-1.5 transition ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 12h18M3 6h18M3 18h18'/></svg>
                    </button>
                    <button onClick={() => onViewChange('timetable')} className={`rounded-md p-1.5 transition ${view === 'timetable' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 6h10 M3 11h16 M3 16h8'/></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
