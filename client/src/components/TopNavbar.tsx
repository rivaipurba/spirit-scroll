import { Search, Sparkles, Settings as SettingsIcon } from 'lucide-react';
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

    return (
        <header className="bg-mal-panel border-b border-mal-border shadow-sm sticky top-0 z-30">
            <div className="mx-auto flex items-center justify-between px-4 h-14 max-w-[1400px]">
                <div className="flex items-center gap-6">
                    <h1 className="text-lg font-bold tracking-wide whitespace-nowrap text-mal-text">
                        SpiritScroll
                    </h1>
                    <nav className="hidden md:flex items-center gap-1">
                        <button
                            onClick={() => onNavigate('home')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
                                currentView === 'home'
                                    ? 'bg-mal-hover text-white'
                                    : 'text-mal-text-secondary hover:text-white hover:bg-mal-hover'
                            }`}
                        >
                            Home
                        </button>
                        <button
                            onClick={() => onNavigate('settings')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
                                currentView === 'settings'
                                    ? 'bg-mal-hover text-white'
                                    : 'text-mal-text-secondary hover:text-white hover:bg-mal-hover'
                            }`}
                        >
                            Settings
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {isSearchOpen ? (
                        <div className="flex items-center bg-mal-card rounded px-2.5 py-1.5 border border-mal-border focus-within:border-mal-blue/50 transition-colors">
                            <Search size={16} className="text-mal-text-secondary mr-2 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Search titles..."
                                className="w-40 sm:w-56 bg-transparent border-none p-0 text-sm text-mal-text placeholder:text-mal-text-secondary/50 focus:outline-none focus:ring-0"
                            />
                            <button
                                onClick={handleSearchToggle}
                                className="ml-1 p-0.5 rounded text-mal-text-secondary hover:text-white cursor-pointer"
                            >
                                <span className="text-xs font-bold">✕</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleSearchToggle}
                            className="p-2 rounded-lg text-mal-text-secondary hover:text-white hover:bg-mal-hover transition-colors cursor-pointer"
                            title="Search"
                        >
                            <Search size={20} />
                        </button>
                    )}

                    <button
                        onClick={onScan}
                        disabled={isScanning}
                        title="Scan for updates"
                        aria-label="Scan for updates"
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-mal-blue/20 text-mal-blue hover:bg-mal-blue/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Sparkles size={14} className={isScanning ? 'animate-pulse' : ''} />
                        <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan'}</span>
                    </button>

                    {headerAction}

                    <div className="flex md:hidden items-center gap-1">
                        <button
                            onClick={() => onNavigate('home')}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                currentView === 'home' ? 'text-white' : 'text-mal-text-secondary hover:text-white'
                            }`}
                        >
                            <span className="text-xs font-bold">HOME</span>
                        </button>
                        <button
                            onClick={() => onNavigate('settings')}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                currentView === 'settings' ? 'text-white' : 'text-mal-text-secondary hover:text-white'
                            }`}
                        >
                            <SettingsIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
