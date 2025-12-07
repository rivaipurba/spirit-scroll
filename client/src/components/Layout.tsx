import React from 'react';
import { Home, Library, Settings } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    currentView: 'home' | 'library' | 'settings';
    onNavigate: (view: 'home' | 'library' | 'settings') => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] flex justify-center selection:bg-indigo-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden max-w-[500px] mx-auto">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-indigo-900/20 blur-[100px]" />
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[100px]" />
            </div>

            <div className="w-full max-w-[500px] min-h-screen bg-[#0a0a0a] border-x border-white/5 shadow-2xl relative flex flex-col z-10">
                <main className="flex-1 pb-24 w-full px-4 sm:px-6 pt-2">
                    {children}
                </main>

                <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 z-50 pb-safe transition-all duration-300">
                    <div className="flex justify-around items-center h-20 px-6">
                        <NavButton
                            icon={<Home size={24} />}
                            label="Home"
                            active={currentView === 'home'}
                            onClick={() => onNavigate('home')}
                        />
                        <NavButton
                            icon={<Library size={24} />}
                            label="Library"
                            active={currentView === 'library'}
                            onClick={() => onNavigate('library')}
                        />
                        <NavButton
                            icon={<Settings size={24} />}
                            label="Settings"
                            active={currentView === 'settings'}
                            onClick={() => onNavigate('settings')}
                        />
                    </div>
                </nav>
            </div>
        </div>
    );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 group relative ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-indigo-500/10 translate-y-[-2px]' : 'group-hover:bg-white/5'}`}>
                {React.cloneElement(icon as any, {
                    strokeWidth: active ? 2.5 : 2,
                    className: `transition-all duration-300 ${active ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`
                })}
            </div>
            <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${active ? 'text-indigo-200' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                {label}
            </span>
            {active && (
                <div className="absolute bottom-2 w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            )}
        </button>
    );
}
