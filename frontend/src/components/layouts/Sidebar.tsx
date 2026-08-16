import {NavLink} from 'react-router-dom';

const navItems = [
    {to: '/', label: 'Trang chủ', icon: 'M3 12l9-9 9 9M5 10v10h14V10'},
    {to: '/search', label: 'Tìm kiếm', icon: 'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'},
    {to: '/library', label: 'Thư viện', icon: 'M4 5h16M4 12h16M4 19h16'},
];

export const Sidebar = () => {
    return (
        <aside className="w-60 shrink-0 border-r border-white/10 p-4">
            <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({isActive}) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d={item.icon}/>
                        </svg>
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};