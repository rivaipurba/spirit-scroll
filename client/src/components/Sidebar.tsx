import { useFilters, type StatusFilter } from '../context/FilterContext';
import { Book, Play, CheckCircle, PauseCircle, XCircle, Bookmark, Tv, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    counts: Record<StatusFilter | 'MANHUA' | 'DONGHUA', number>;
    total: number;
}

const STATUS_LINKS: { id: StatusFilter; label: string; icon: typeof Book }[] = [
    { id: 'ALL', label: 'All', icon: Book },
    { id: 'READING', label: 'Reading', icon: Play },
    { id: 'WATCHING', label: 'Watching', icon: Tv },
    { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
    { id: 'ON_HOLD', label: 'On Hold', icon: PauseCircle },
    { id: 'DROPPED', label: 'Dropped', icon: XCircle },
    { id: 'PLAN_TO_READ', label: 'Plan to Read', icon: Bookmark },
];

export function Sidebar({ counts, total }: SidebarProps) {
    const { statusFilter, setStatusFilter, typeFilter, setTypeFilter } = useFilters();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const sidebarContent = (
        <div className="space-y-5">
            <div>
                <h3 className="text-xs font-semibold text-mal-text-secondary uppercase tracking-wider mb-2 px-3">
                    Status
                </h3>
                <nav className="space-y-0.5">
                    {STATUS_LINKS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => {
                                setStatusFilter(id);
                                setIsMobileOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                statusFilter === id
                                    ? 'bg-mal-blue/15 text-mal-blue'
                                    : 'text-mal-text-secondary hover:bg-mal-hover hover:text-white'
                            }`}
                        >
                            <Icon size={16} className="shrink-0" />
                            <span className="flex-1 text-left">{label}</span>
                            <span className={`text-xs font-semibold min-w-[20px] text-right ${
                                statusFilter === id ? 'text-mal-blue' : 'text-mal-text-secondary/60'
                            }`}>
                                {id === 'ALL' ? total : (counts[id] ?? 0)}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="border-t border-mal-border mx-3" />

            <div>
                <h3 className="text-xs font-semibold text-mal-text-secondary uppercase tracking-wider mb-2 px-3">
                    Type
                </h3>
                <div className="flex flex-col gap-0.5">
                    <button
                        onClick={() => {
                            setTypeFilter('ALL');
                            setIsMobileOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            typeFilter === 'ALL'
                                ? 'bg-mal-blue/15 text-mal-blue'
                                : 'text-mal-text-secondary hover:bg-mal-hover hover:text-white'
                        }`}
                    >
                        All Types
                    </button>
                    <button
                        onClick={() => {
                            setTypeFilter('MANHUA');
                            setIsMobileOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            typeFilter === 'MANHUA'
                                ? 'bg-mal-blue/15 text-mal-blue'
                                : 'text-mal-text-secondary hover:bg-mal-hover hover:text-white'
                        }`}
                    >
                        Manhua ({counts['MANHUA'] ?? 0})
                    </button>
                    <button
                        onClick={() => {
                            setTypeFilter('DONGHUA');
                            setIsMobileOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            typeFilter === 'DONGHUA'
                                ? 'bg-mal-blue/15 text-mal-blue'
                                : 'text-mal-text-secondary hover:bg-mal-hover hover:text-white'
                        }`}
                    >
                        Donghua ({counts['DONGHUA'] ?? 0})
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="fixed bottom-4 left-4 z-40 md:hidden bg-mal-blue text-white p-3 rounded-full shadow-lg cursor-pointer"
                aria-label="Toggle sidebar filters"
            >
                {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`
                fixed md:sticky top-14 z-30 h-[calc(100vh-3.5rem)]
                w-52 bg-mal-panel border-r border-mal-border p-4 overflow-y-auto
                transition-transform duration-200
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isMobileOpen ? 'shadow-xl md:shadow-none' : ''}
            `}>
                {sidebarContent}
            </aside>
        </>
    );
}
