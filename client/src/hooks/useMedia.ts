import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/api";

export function useMediaList() {
    return useQuery({
        queryKey: ["media-list"],
        queryFn: async () => {
            const res = await client.api.media.$get();
            if (!res.ok) {
                throw new Error("Failed to fetch media");
            }
            return await res.json();
        },
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
        mutationFn: async (json: { title: string; type: "MANHUA" | "DONGHUA"; totalChapters: number; status: "READING" | "COMPLETED" | "PLAN_TO_READ" }) => {
            const res = await client.api.media.$post({
                json: {
                    ...json,
                    currentChapter: 0,
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
