import { useEffect } from 'react';

interface KeyboardShortcuts {
    onSearch?: () => void;
    onNewEntry?: () => void;
    onSettings?: () => void;
}

export function useKeyboardShortcuts({ onSearch, onNewEntry, onSettings }: KeyboardShortcuts) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Cmd/Ctrl + K for search
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                onSearch?.();
            }

            // Cmd/Ctrl + N for new entry
            if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
                event.preventDefault();
                onNewEntry?.();
            }

            // Cmd/Ctrl + , for settings
            if ((event.metaKey || event.ctrlKey) && event.key === ',') {
                event.preventDefault();
                onSettings?.();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onSearch, onNewEntry, onSettings]);
}