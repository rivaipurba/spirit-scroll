import { useEffect } from 'react';
import { useSearch } from '../context/SearchContext';

interface ShortcutOptions {
    enabled: boolean;
    onNew: () => void;
    onScan: () => void;
    isScanning: boolean;
}

function isTyping(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Library shortcuts: `/` search, `n` new entry, `s` scan. Inactive while typing or while a dialog is open. */
export function useKeyboardShortcuts({ enabled, onNew, onScan, isScanning }: ShortcutOptions) {
    const { setIsSearchOpen } = useSearch();

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
            if (isTyping(e.target)) return;
            if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

            if (e.key === '/') {
                e.preventDefault();
                setIsSearchOpen(true);
                // The field may already be open but unfocused, so focus it directly after it mounts
                requestAnimationFrame(() => {
                    document.querySelector<HTMLInputElement>('input[aria-label="Search titles"]')?.focus();
                });
            } else if (e.key === 'n') {
                e.preventDefault();
                onNew();
            } else if (e.key === 's' && !isScanning) {
                e.preventDefault();
                onScan();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, onNew, onScan, isScanning, setIsSearchOpen]);
}
