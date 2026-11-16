import { useFilters, type StatusFilter, type TypeFilter } from '../context/FilterContext';

interface SidebarProps {
    counts: Record<Exclude<StatusFilter, 'ALL'> | 'MANHUA' | 'DONGHUA', number>;
    total: number;
}

const STATUS_LINKS: { id: StatusFilter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'READING', label: 'Reading' },
    { id: 'WATCHING', label: 'Watching' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'ON_HOLD', label: 'On Hold' },
    { id: 'DROPPED', label: 'Dropped' },
    { id: 'PLAN_TO_READ', label: 'Plan to Read' },
];

const TYPE_LINKS: { id: TypeFilter; label: string }[] = [
    { id: 'ALL', label: 'All Types' },
    { id: 'MANHUA', label: 'Manhua' },
    { id: 'DONGHUA', label: 'Donghua' },
];

export function Sidebar({ counts, total }: SidebarProps) {
    const { statusFilter, setStatusFilter, typeFilter, setTypeFilter } = useFilters();

    const statusCount = (id: StatusFilter) => (id === 'ALL' ? total : (counts[id] ?? 0));
    const typeCount = (id: TypeFilter) => (id === 'ALL' ? null : (counts[id] ?? 0));

    return (
        <>
            {/* Phones: two sideways rows of tabs, always in reach above the list */}
            <div className="md:hidden border-b border-rule">
                <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto px-4 pt-2 pb-1 [scrollbar-width:none]">
                    {STATUS_LINKS.map(({ id, label }) => {
                        const active = statusFilter === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setStatusFilter(id)}
                                aria-pressed={active}
                                className={`btn shrink-0 px-3 min-h-11 ${active ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2'}`}
                            >
                                {label}
                                <span className={`tabular-nums ${active ? 'text-paper' : 'text-muted'}`}>{statusCount(id)}</span>
                            </button>
                        );
                    })}
                </nav>
                <nav aria-label="Filter by type" className="flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
                    {TYPE_LINKS.map(({ id, label }) => {
                        const active = typeFilter === id;
                        const count = typeCount(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTypeFilter(id)}
                                aria-pressed={active}
                                className={`btn shrink-0 px-3 min-h-11 ${active ? 'bg-paper-3 text-ink' : 'text-muted hover:bg-paper-2 hover:text-ink'}`}
                            >
                                {label}
                                {count !== null && <span className="tabular-nums">{count}</span>}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Desktop: a quiet column of filters with counts */}
            <aside className="hidden md:block w-56 shrink-0 sticky top-16 self-start h-[calc(100dvh-4rem)] overflow-y-auto border-r border-rule px-4 py-6">
                <h2 className="font-body text-sm font-medium text-muted px-3 mb-2">Status</h2>
                <nav aria-label="Filter by status" className="flex flex-col gap-0.5">
                    {STATUS_LINKS.map(({ id, label }) => {
                        const active = statusFilter === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setStatusFilter(id)}
                                aria-pressed={active}
                                className={`w-full flex items-center gap-2 min-h-9 px-3 rounded-full text-sm transition-colors duration-(--dur-short) focus-visible:outline-2 focus-visible:outline-focus ${
                                    active
                                        ? 'bg-paper-3 text-ink font-medium'
                                        : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                                }`}
                            >
                                <span className="flex-1 text-left">{label}</span>
                                <span className={`tabular-nums text-sm ${active ? 'text-ink' : 'text-muted'}`}>
                                    {statusCount(id)}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                <h2 className="font-body text-sm font-medium text-muted px-3 mt-8 mb-2">Type</h2>
                <nav aria-label="Filter by type" className="flex flex-col gap-0.5">
                    {TYPE_LINKS.map(({ id, label }) => {
                        const active = typeFilter === id;
                        const count = typeCount(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTypeFilter(id)}
                                aria-pressed={active}
                                className={`w-full flex items-center gap-2 min-h-9 px-3 rounded-full text-sm transition-colors duration-(--dur-short) focus-visible:outline-2 focus-visible:outline-focus ${
                                    active
                                        ? 'bg-paper-3 text-ink font-medium'
                                        : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                                }`}
                            >
                                <span className="flex-1 text-left">{label}</span>
                                {count !== null && (
                                    <span className={`tabular-nums text-sm ${active ? 'text-ink' : 'text-muted'}`}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
