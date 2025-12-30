export interface Media {
    id: number;
    title: string;
    type: "MANHUA" | "DONGHUA";
    currentChapter: number;
    totalChapters: number | null;
    status: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED";
    coverUrl?: string | null;
    sourceUrl?: string | null;
    latestReleasedChapter?: number | null;
    isPinned?: boolean;
    updatedAt?: string;
    createdAt?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
