import { Outlet } from "react-router-dom";
import { Music2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout() {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 overflow-hidden px-4 py-8">
            {/* Top Right Theme Toggle */}
            <div className="absolute top-6 right-6 z-20">
                <ThemeToggle />
            </div>

            {/* Background Decorative Blur & Glow Elements */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 dark:bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Header / Logo */}
            <div className="z-10 mb-6 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl shadow-lg shadow-purple-500/20">
                    <Music2 className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-purple-300 bg-clip-text text-transparent tracking-tight">
                    Music App
                </span>
            </div>

            {/* Main Auth Content Form */}
            <main className="z-10 w-full max-w-md">
                <Outlet />
            </main>
        </div>
    );
}
