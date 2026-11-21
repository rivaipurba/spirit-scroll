// Backlog as heat: a few behind runs ember, a long backlog runs toward white heat.
// Tiers match the old badge: 1-5, 6-50, over 50.
export function heatTier(count: number): 1 | 2 | 3 {
    return count > 50 ? 3 : count > 5 ? 2 : 1;
}

export const HEAT_LEGEND: Record<1 | 2 | 3, string> = {
    1: '1–5',
    2: '6–50',
    3: 'over 50',
};

export const HEAT_BG: Record<1 | 2 | 3, string> = {
    1: 'bg-heat-3',
    2: 'bg-heat-4',
    3: 'bg-heat-5',
};
