import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { client } from "../lib/api";

export function useMediaList(page: number = 1, type?: "MANHUA" | "DONGHUA", limit: number = 12) {
    return useQuery({
        queryKey: ["media-list", { page, type, limit }],
        queryFn: async () => {
            const res = await client.api.media.$get({
                query: {
                    page: page.toString(),
                    limit: limit.toString(),
                    type: type
                }
            });
            if (!res.ok) {
                throw new Error("Failed to fetch media");
            }
            return await res.json();
        },
        placeholderData: keepPreviousData,
    });
}

export function useUpdateProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status, currentChapter }: { id: number, status?: "READING" | "COMPLETED", currentChapter?: number }) => {
            const res = await client.api.media[":id"].$patch({
                param: { id: id.toString() },
                json: {
                    status,
                    currentChapter
                }
            });
            if (!res.ok) {
                throw new Error("Failed to update media");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
        },
    });
}

export function useCreateMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (json: { title: string; type: "MANHUA" | "DONGHUA"; totalChapters: number | null; currentChapter: number; status: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED"; sourceUrl?: string }) => {
            const res = await client.api.media.$post({
                json: {
                    ...json,
                    status: "READING" // Default to READING for now or pass from UI if needed
                }
            });
            if (!res.ok) {
                throw new Error("Failed to create media");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
        },
    });


}

export function useUpdateMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: { id: number; title?: string; type?: "MANHUA" | "DONGHUA"; currentChapter?: number; totalChapters?: number | null; status?: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED"; sourceUrl?: string | null }) => {
            const res = await client.api.media[":id"].$patch({
                param: { id: id.toString() },
                json: data
            });
            if (!res.ok) {
                throw new Error("Failed to update media");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
        },
    });
}

export function useDeleteMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await client.api.media[":id"].$delete({
                param: { id: id.toString() }
            });
            if (!res.ok) {
                throw new Error("Failed to delete media");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
        },
    });
}

export function useImportMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any[]) => {
            const res = await client.api.import.$post({
                json: data
            });
            if (!res.ok) {
                throw new Error("Failed to import media");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
        },
    });
}

export function useCheckUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await client.api.media[":id"].check.$post({
                param: { id: id.toString() }
            });
            if (!res.ok) {
                if (res.status === 404) throw new Error("Chapter info not found");
                throw new Error("Failed to check updates");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
        },
    });
}

export function useScanAll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await client.api["check-all"].$post();
            if (!res.ok) {
                throw new Error("Failed to scan for updates");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
        },
    });
}

