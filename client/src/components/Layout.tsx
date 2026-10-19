import React from 'react';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { TopNavbar } from './TopNavbar';
import type { MediaStats } from '../types/index';

interface LayoutProps {
    children: React.ReactNode;
    currentView: 'home' | 'settings';
    onNavigate: (view: 'home' | 'settings') => void;
    isScanning: boolean;
    onScan: () => void;
    stats: MediaStats;
    headerAction?: React.ReactNode;
}

export function Layout({
    children,
    currentView,
    onNavigate,
    isScanning,
    onScan,
    stats,
    headerAction,
}: LayoutProps) {
    return (
        <div className="min-h-screen bg-mal-page flex flex-col">
            <TopNavbar
                currentView={currentView}
                onNavigate={onNavigate}
                headerAction={headerAction}
                isScanning={isScanning}
                onScan={onScan}
            />

            <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
                {/* Left Sidebar */}
                <Sidebar counts={stats.counts} total={stats.total} />

                {/* Main Content */}
                <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
                    {children}
                </main>

                {/* Right Sidebar (desktop only) */}
                {currentView === 'home' && <RightSidebar stats={stats} />}
            </div>
        </div>
    );
}
