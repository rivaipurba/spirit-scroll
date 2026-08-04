import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { client, BASE_URL, getAuthToken } from "../lib/api";
import { useToastContext } from "../context/ToastContext";
import type { Media, PaginatedResponse } from "../types/index";

export function useMediaList(page: number = 1, type?: "MANHUA" | "DONGHUA", limit: number = 12, sortBy?: "title" | "progress" | "recent" | "updates" | "type" | "unwatched", search?: string) {
    return useQuery({
        queryKey: ["media-list", { page, type, limit, sortBy, search }],
        queryFn: async () => {
            const res = await client.api.media.$get({
                query: {
                    page: page.toString(),
                    limit: limit.toString(),
                    type: type,
                    sortBy: sortBy,
                    search: search?.trim() || undefined
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
    const toast = useToastContext();

    return useMutation({
        mutationFn: async ({ id, status, currentChapter, totalChapters }: { id: number, status?: "READING" | "COMPLETED", currentChapter?: number, totalChapters?: number | null }) => {
            // Auto-detect completion when currentChapter reaches totalChapters
            const autoStatus = !status && totalChapters != null && totalChapters > 0 && (currentChapter ?? 0) >= totalChapters
                ? 'COMPLETED' as const
                : undefined;

            const res = await client.api.media[":id"].$patch({
                param: { id: id.toString() },
                json: {
                    status: autoStatus || status,
                    currentChapter
                }
            });
            if (!res.ok) {
                throw new Error("Failed to update media");
            }
            return await res.json();
        },
        onMutate: async ({ id, status, currentChapter, totalChapters }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["media-list"] });

            // Snapshot the previous value
            const previousData = queryClient.getQueriesData({ queryKey: ["media-list"] });

            // Auto-detect completion for optimistic update
            const autoStatus = !status && totalChapters != null && totalChapters > 0 && (currentChapter ?? 0) >= totalChapters
                ? 'COMPLETED' as const
                : undefined;
            const resolvedStatus = autoStatus || status;

            // Optimistically update the cache
            queryClient.setQueriesData({ queryKey: ["media-list"] }, (old: PaginatedResponse<Media> | undefined) => {
                if (!old?.data) return old;

                return {
                    ...old,
                    data: old.data.map((item: Media) =>
                        item.id === id
                            ? { ...item, currentChapter: currentChapter ?? item.currentChapter, status: resolvedStatus ?? item.status }
                            : item
                    )
                };
            });

            return { previousData };
        },
        onError: (_error, _variables, context) => {
            // Rollback on error
            if (context?.previousData) {
                context.previousData.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(
                "Update Failed",
                "Failed to update progress. Please try again."
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
        },
    });
}

export function useCreateMedia() {
    const queryClient = useQueryClient();
    const toast = useToastContext();

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
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
            toast.success(
                "Entry Created",
                `"${data.title}" has been added to your library`
            );
        },
        onError: (error) => {
            toast.error(
                "Failed to Create Entry",
                error.message || "Something went wrong while creating the entry"
            );
        },
    });
}

export function useUpdateMedia() {
    const queryClient = useQueryClient();
    const toast = useToastContext();

    return useMutation({
        mutationFn: async ({ id, ...data }: { id: number; title?: string; type?: "MANHUA" | "DONGHUA"; currentChapter?: number; totalChapters?: number | null; status?: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED"; sourceUrl?: string | null; isPinned?: boolean }) => {
            const res = await client.api.media[":id"].$patch({
                param: { id: id.toString() },
                json: data
            });
            if (!res.ok) {
                throw new Error("Failed to update media");
            }
            return await res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
            toast.success(
                "Entry Updated",
                `"${data.title}" has been updated`
            );
        },
        onError: (error) => {
            toast.error(
                "Update Failed",
                error.message || "Failed to update entry"
            );
        },
    });
}

export function useDeleteMedia() {
    const queryClient = useQueryClient();
    const toast = useToastContext();

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
            toast.success(
                "Entry Deleted",
                "The entry has been removed from your library"
            );
        },
        onError: (error) => {
            toast.error(
                "Delete Failed",
                error.message || "Failed to delete entry"
            );
        },
    });
}

export function useImportMedia() {
    const queryClient = useQueryClient();
    const toast = useToastContext();

    return useMutation({
        mutationFn: async (data: Partial<Media>[]) => {
            const res = await client.api.import.$post({
                json: data
            });
            if (!res.ok) {
                throw new Error("Failed to import media");
            }
            return await res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
            toast.success(
                "Import Successful",
                `Successfully imported ${data.count} entries`
            );
        },
        onError: (error) => {
            toast.error(
                "Import Failed",
                error.message || "Failed to import data"
            );
        },
    });
}

export function useCheckUpdate() {
    const queryClient = useQueryClient();
    const toast = useToastContext();

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
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["media-list"] });
            if (data.has_update) {
                toast.success(
                    "New Chapter Found!",
                    `Chapter ${data.new_chapter} is now available`
                );
            } else {
                toast.info(
                    "No Updates",
                    "You're up to date with the latest chapter"
                );
            }
        },
        onError: (error) => {
            toast.error(
                "Update Check Failed",
                error.message || "Failed to check for updates"
            );
        },
    });
}

export function useScanUpdates() {
    const queryClient = useQueryClient();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number; currentTitle: string } | null>(null);
    const [result, setResult] = useState<{ updated: number } | null>(null);
    const cancelRef = useRef(false);

    const startScan = async () => {
        if (isScanning) return;
        cancelRef.current = false;
        setIsScanning(true);
        setResult(null);
        setProgress(null);

        let targets: Media[] = [];
        try {
            const token = getAuthToken();
            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${BASE_URL}api/media?limit=1000`, { headers });
            if (res.ok) {
                const data = await res.json();
                targets = (data.data || []).filter((m: Media) => m.status === 'READING' && m.sourceUrl);
            }
        } catch {
            setIsScanning(false);
            return;
        }

        let updatedCount = 0;

        for (let i = 0; i < targets.length; i++) {
            if (cancelRef.current) break;

            const item = targets[i];
            setProgress({ current: i + 1, total: targets.length, currentTitle: item.title });

            try {
                const token = getAuthToken();
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${BASE_URL}api/media/${item.id}/check`, { method: 'POST', headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data.has_update) updatedCount++;
                }
            } catch {
                // skip failed items
            }
        }

        setIsScanning(false);
        if (!cancelRef.current) {
            setResult({ updated: updatedCount });
            queryClient.invalidateQueries({ queryKey: ['media-list'] });
            setTimeout(() => setResult(null), 5000);
        }
        setProgress(null);
    };

    const cancelScan = () => {
        cancelRef.current = true;
    };

    return { startScan, cancelScan, isScanning, progress, result };
}
