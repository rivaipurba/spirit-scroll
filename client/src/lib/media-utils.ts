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
