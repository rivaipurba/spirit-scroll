import type { Media } from '../types/index';
import { HEAT_BG, heatTier } from '../lib/heat';

interface UpdateBadgeProps {
    count: number;
    type: Media['type'];
}

// The backlog as heat: a short key in the ramp step the count reaches, then the count in Boska.
// Tiers: 1-5 ember, 6-50 amber, over 50 white heat.
export function UpdateBadge({ count, type }: UpdateBadgeProps) {
    const noun = type === 'DONGHUA' ? 'unwatched episode' : 'unread chapter';
    const tooltip = `${count} ${noun}${count === 1 ? '' : 's'}`;

    return (
        <span
            className="shrink-0 inline-flex items-center gap-2 whitespace-nowrap"
            title={tooltip}
            aria-label={tooltip}
        >
            <span className={`heat-key ${HEAT_BG[heatTier(count)]}`} aria-hidden="true" />
            <span className="figure text-lg text-ink" aria-hidden="true">{count}</span>
            <span className="text-xs text-ink-2" aria-hidden="true">new</span>
        </span>
    );
}
