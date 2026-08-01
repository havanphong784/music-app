import {useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import {
    Compass,
    Flame,
    Heart,
    Home,
    Library,
    ListMusic,
    LogIn,
    Music2,
    Radio,
    Settings,
    User as UserIcon,
} from "lucide-react";

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const {user, logout} = useAuth();

    const mainNavItems = [
        {title: "Trang chủ", url: "/", icon: Home},
        {title: "Khám phá", url: "/explore", icon: Compass},
        {title: "Bảng xếp hạng", url: "/charts", icon: Flame},
        {title: "Thư viện nhạc", url: "/library", icon: Library},
        {title: "Bài hát đã thích", url: "/favorites", icon: Heart},
        {title: "Radio & Podcast", url: "/radio", icon: Radio},
    ];

    const playlists = [
        {id: "1", title: "Top V-Pop 2026"},
        {id: "2", title: "Lofi Chill & Study"},
        {id: "3", title: "Indie Việt Nam"},
        {id: "4", title: "Workout Energy"},
    ];

    const handleLogout = async () => {
        await logout();
        navigate("/auth/login");
    };

    return (
        <Sidebar collapsible="icon">
            {/* Header Logo */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip="Music App"
                            onClick={() => navigate("/")}
                        >
                            <div
                                className="flex aspect-square size-8 items-center justify-center">
                                <Music2 className="size-4"/>
                            </div>
                            <span
                                className="font-bold text-xl">
                                    Music App
                                </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/*<SidebarSeparator />*/}

            {/* Content Body */}
            <SidebarContent>
                {/* Menu Chính */}
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Chính</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => {
                                const isActive = location.pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            isActive={isActive}
                                            tooltip={item.title}
                                            onClick={() => navigate(item.url)}
                                        >
                                            <item.icon/>
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator/>

                {/* Playlist Của Tôi */}
                <SidebarGroup>
                    <SidebarGroupLabel>Playlist Của Tôi</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {playlists.map((playlist) => (
                                <SidebarMenuItem key={playlist.id}>
                                    <SidebarMenuButton
                                        tooltip={playlist.title}
                                        onClick={() => navigate(`/playlist/${playlist.id}`)}
                                    >
                                        <ListMusic/>
                                        <span>{playlist.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator/>

                {/* System Settings */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Cài đặt"
                                    isActive={location.pathname === "/settings"}
                                    onClick={() => navigate("/settings")}
                                >
                                    <Settings/>
                                    <span>Cài đặt</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer User Profile / Logout */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {user ? (
                            <SidebarMenuButton
                                tooltip={`${user.email} (Bấm để Đăng xuất)`}
                                onClick={handleLogout}
                            >
                                <UserIcon/>
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold text-xs">{user.email.split("@")[0]}</span>
                                    <span className="text-[10px] text-muted-foreground">Đăng xuất</span>
                                </div>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                size="lg"
                                tooltip="Đăng nhập"
                                onClick={() => navigate("/auth/login")}
                            >
                                <LogIn/>
                                <span className="font-semibold">Đăng nhập</span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}