import { useFilters, type StatusFilter } from '../context/FilterContext';
import { Book, Play, CheckCircle, PauseCircle, XCircle, Bookmark, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    counts: Record<StatusFilter | 'MANHUA' | 'DONGHUA', number>;
    total: number;
}

const STATUS_LINKS: { id: StatusFilter; label: string; icon: typeof Book }[] = [
    { id: 'ALL', label: 'All', icon: Book },
    { id: 'READING', label: 'Reading', icon: Play },
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
            {/* Status Filter Section */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
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
                                    ? 'bg-mal-blue/10 text-mal-blue'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
                        >
                            <Icon size={16} className="shrink-0" />
                            <span className="flex-1 text-left">{label}</span>
                            <span className={`text-xs font-semibold min-w-[20px] text-right ${
                                statusFilter === id ? 'text-mal-blue' : 'text-gray-400'
                            }`}>
                                {id === 'ALL' ? total : (counts[id] ?? 0)}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mx-3" />

            {/* Type Filter Section */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
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
                                ? 'bg-mal-blue/10 text-mal-blue'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
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
                                ? 'bg-mal-blue/10 text-mal-blue'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
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
                                ? 'bg-mal-blue/10 text-mal-blue'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
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
            {/* Mobile toggle button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="fixed bottom-4 left-4 z-40 md:hidden bg-mal-blue text-white p-3 rounded-full shadow-lg cursor-pointer"
                aria-label="Toggle sidebar filters"
            >
                {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar - desktop always visible, mobile as drawer */}
            <aside className={`
                fixed md:sticky top-14 z-30 h-[calc(100vh-3.5rem)]
                w-52 bg-white border-r border-gray-200 p-4 overflow-y-auto
                transition-transform duration-200
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isMobileOpen ? 'shadow-xl md:shadow-none' : ''}
            `}>
                {sidebarContent}
            </aside>
        </>
    );
}
