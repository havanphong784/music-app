import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/SideBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, Bell, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
    const { user } = useAuth();

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background min-h-screen flex flex-col">
                {/* Header Top Bar */}
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md transition-colors duration-200">
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                        <Separator orientation="vertical" className="h-5" />
                        
                        {/* Search Input Bar */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="search"
                                aria-label="Tìm kiếm bài hát"
                                placeholder="Tìm kiếm bài hát, nghệ sĩ, album..."
                                className="pl-9 bg-muted/50 border-transparent focus:border-purple-500 focus:bg-background h-9 rounded-2xl text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Top Right Utilities */}
                    <div className="flex items-center gap-2">
                        {/* Notification Button */}
                        <button
                            type="button"
                            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors"
                            aria-label="Thông báo"
                            title="Thông báo"
                        >
                            <Bell className="size-5" />
                        </button>

                        {/* Theme Toggle Button */}
                        <ThemeToggle />

                        {/* User Avatar Badge */}
                        {user ? (
                            <div className="flex items-center gap-2 pl-2 border-l border-border">
                                <div className="flex size-8 items-center justify-center rounded-full bg-purple-600/20 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 font-bold text-xs">
                                    <UserIcon className="size-4" />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </header>

                {/* Main View Area */}
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}