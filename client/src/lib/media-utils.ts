export const STATUS_COLORS: Record<string, string> = {
    READING: 'bg-mal-blue',
    COMPLETED: 'bg-mal-blue-status',
    ON_HOLD: 'bg-mal-yellow',
    DROPPED: 'bg-mal-red',
    PLAN_TO_READ: 'bg-mal-gray',
};

export function getStatusLabel(status: string, type: string): string {
    switch (status) {
        case 'COMPLETED': return 'Completed';
        case 'ON_HOLD': return 'On Hold';
        case 'DROPPED': return 'Dropped';
        case 'PLAN_TO_READ': return 'Plan to Read';
        case 'READING': return type === 'DONGHUA' ? 'Watching' : 'Reading';
        default: return status;
    }
}
