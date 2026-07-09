import { MediaTableRow } from './MediaTableRow';
import type { Media } from '../types/index';

interface MediaTableProps {
    mediaList: Media[];
    isLoading: boolean;
}

export function MediaTable({ mediaList, isLoading }: MediaTableProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                        <div className="w-8 h-4 bg-gray-100 rounded animate-pulse" />
                        <div className="w-[50px] h-[70px] bg-gray-100 rounded animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (mediaList.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <p className="text-gray-500 font-medium">No entries found</p>
                <p className="text-gray-400 text-sm mt-1">Add your first entry to get started!</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80">
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                        <th className="py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[60px]">Cover</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Progress</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Status</th>
                        <th className="py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {mediaList.map((media, index) => (
                        <MediaTableRow key={media.id} media={media} rank={index + 1} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
