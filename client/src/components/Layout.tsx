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
        <div className="min-h-dvh bg-paper text-ink flex flex-col">
            <a
                href="#main"
                className="btn btn-primary px-4 fixed left-4 top-3 z-50 -translate-y-20 focus:translate-y-0"
            >
                Skip to content
            </a>
            <TopNavbar
                currentView={currentView}
                onNavigate={onNavigate}
                headerAction={headerAction}
                isScanning={isScanning}
                onScan={onScan}
            />

            <div className="flex flex-col md:flex-row flex-1 max-w-(--container) mx-auto w-full">
                {/* Filters: a left column on desktop, a sideways tab row on phones */}
                <Sidebar counts={stats.counts} total={stats.total} />

                {/* Main Content */}
                <main id="main" tabIndex={-1} className="flex-1 min-w-0 px-4 pt-4 pb-16 md:px-8 md:pt-6 focus:outline-none">
                    {children}
                </main>

                {/* Right Sidebar (desktop only) */}
                {currentView === 'home' && <RightSidebar stats={stats} />}
            </div>
        </div>
    );
}
