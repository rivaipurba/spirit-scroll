import { createContext, useContext, useState, type ReactNode } from 'react';

export type StatusFilter = 'ALL' | 'READING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED' | 'PLAN_TO_READ';
export type TypeFilter = 'ALL' | 'MANHUA' | 'DONGHUA';

interface FilterContextType {
    statusFilter: StatusFilter;
    setStatusFilter: (filter: StatusFilter) => void;
    typeFilter: TypeFilter;
    setTypeFilter: (filter: TypeFilter) => void;
    sortBy: 'updates' | 'title';
    setSortBy: (sort: 'updates' | 'title') => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
    const [sortBy, setSortBy] = useState<'updates' | 'title'>('updates');

    return (
        <FilterContext.Provider value={{ statusFilter, setStatusFilter, typeFilter, setTypeFilter, sortBy, setSortBy }}>
            {children}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
}
