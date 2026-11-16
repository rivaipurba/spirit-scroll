import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

// Keyboard contract for a modal: focus moves in on open (to [data-autofocus] or the first control),
// Tab and Shift+Tab stay inside, Escape closes, and focus returns to the opener on close.
export function useDialogFocus(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const node = ref.current;
        if (!active || !node) return;

        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const initial = node.querySelector<HTMLElement>('[data-autofocus]') ?? node.querySelector<HTMLElement>(FOCUSABLE) ?? node;
        initial.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onCloseRef.current();
                return;
            }
            if (e.key !== 'Tab') return;

            const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
                .filter((el) => el.getClientRects().length > 0);
            if (items.length === 0) {
                e.preventDefault();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        node.addEventListener('keydown', handleKeyDown);
        return () => {
            node.removeEventListener('keydown', handleKeyDown);
            if (opener?.isConnected) opener.focus();
        };
    }, [active, ref]);
}
