import { Search, RefreshCw, Settings as SettingsIcon, X } from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { useState, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';

interface TopNavbarProps {
    currentView: 'home' | 'settings';
    onNavigate: (view: 'home' | 'settings') => void;
    headerAction?: React.ReactNode;
    isScanning: boolean;
    onScan: () => void;
}

export function TopNavbar({ currentView, onNavigate, headerAction, isScanning, onScan }: TopNavbarProps) {
    const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen } = useSearch();
    const [inputValue, setInputValue] = useState(searchQuery);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInputValue(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue !== searchQuery) {
                setSearchQuery(inputValue);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue, setSearchQuery, searchQuery]);

    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleClear = () => {
        setSearchQuery('');
        setIsSearchOpen(false);
        setInputValue('');
    };

    const handleSearchToggle = (e: MouseEvent) => {
        e.stopPropagation();
        if (isSearchOpen) {
            handleClear();
        } else {
            setIsSearchOpen(true);
        }
    };

    const navLink = (view: 'home' | 'settings', label: string) => (
        <button
            type="button"
            onClick={() => onNavigate(view)}
            aria-current={currentView === view ? 'page' : undefined}
            className={`btn px-3 ${
                currentView === view
                    ? 'bg-paper-3 text-ink'
                    : 'text-muted hover:text-ink hover:bg-paper-2'
            }`}
        >
            {label}
        </button>
    );

    return (
        <header className="bg-paper border-b border-rule sticky top-0 z-(--z-sticky-nav)">
            <div className="relative mx-auto flex items-center justify-between gap-3 px-4 md:px-8 h-16 max-w-(--container)">
                <div className="flex items-center gap-6 min-w-0">
                    <button
                        type="button"
                        onClick={() => onNavigate('home')}
                        aria-label="SpiritScroll, go to library"
                        className="font-display text-2xl leading-none tracking-[-0.02em] text-ink whitespace-nowrap rounded-md py-2.5 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-4"
                    >
                        SpiritScroll
                    </button>
                    <nav aria-label="Main" className="hidden md:flex items-center gap-1">
                        {navLink('home', 'Home')}
                        {navLink('settings', 'Settings')}
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {isSearchOpen ? (
                        <div className="absolute inset-x-0 top-full border-b border-rule bg-paper px-4 py-2 md:static md:border-0 md:p-0 md:bg-transparent">
                            <div className="flex items-center gap-2 h-10 rounded-full bg-paper-2 px-3 shadow-[inset_0_0_0_1px_var(--color-rule-strong)] focus-within:outline-2 focus-within:outline-focus focus-within:-outline-offset-2">
                                <Search size={16} className="text-muted shrink-0" aria-hidden="true" />
                                <input
                                    ref={inputRef}
                                    type="search"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Search titles…"
                                    aria-label="Search titles"
                                    className="w-full md:w-56 min-w-0 bg-transparent border-0 p-0 text-md text-ink focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleSearchToggle}
                                    aria-label="Close search"
                                    className="hit shrink-0 rounded-full p-1 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSearchToggle}
                            className="btn btn-quiet btn-icon"
                            aria-label="Search"
                            title="Search"
                        >
                            <Search size={18} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onScan}
                        disabled={isScanning}
                        title="Scan for updates"
                        aria-label="Scan for updates"
                        className="btn btn-ghost btn-icon sm:px-4"
                    >
                        <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} aria-hidden="true" />
                        <span className="hidden sm:inline">{isScanning ? 'Scanning…' : 'Scan'}</span>
                    </button>

                    {headerAction}

                    <button
                        type="button"
                        onClick={() => onNavigate('settings')}
                        aria-label="Settings"
                        aria-current={currentView === 'settings' ? 'page' : undefined}
                        className={`btn btn-icon md:hidden ${currentView === 'settings' ? 'bg-paper-3 text-ink' : 'btn-quiet'}`}
                    >
                        <SettingsIcon size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
