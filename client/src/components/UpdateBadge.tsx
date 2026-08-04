import type { Media } from '../types/index';

interface UpdateBadgeProps {
    count: number;
    type: Media['type'];
}

// Small rounded pill showing just the unwatched/unread count.
// Color escalates with backlog size: 1-5 soft yellow, 6-50 orange, >50 red.
export function UpdateBadge({ count, type }: UpdateBadgeProps) {
    const noun = type === 'DONGHUA' ? 'unwatched episode' : 'unread chapter';
    const tier = count > 50 ? 'red' : count > 5 ? 'orange' : 'yellow';
    const styles = {
        red: 'bg-mal-red/15 text-mal-red',
        orange: 'bg-mal-orange/15 text-mal-orange',
        yellow: 'bg-mal-yellow/15 text-mal-yellow',
    };
    const tooltip = `${count} ${noun}${count === 1 ? '' : 's'}`;

    return (
        <span
            className={`shrink-0 inline-block px-1.5 py-0.5 rounded-md text-[11px] font-semibold leading-none ${styles[tier]}`}
            title={tooltip}
            aria-label={tooltip}
        >
            {count}
        </span>
    );
}
