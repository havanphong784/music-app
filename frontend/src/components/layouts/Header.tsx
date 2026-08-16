import {Link} from 'react-router-dom';
import {useAuth} from '../../contexts/AuthContext';

export const Header = () => {
    const {user, logout} = useAuth();

    return (
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
            <Link to="/" className="flex items-center gap-2">
                <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-zinc-950 font-bold">S</span>
                <span className="font-semibold">sonora</span>
            </Link>

            {/* Search - tạm placeholder, sau này làm */}
            <input
                type="search"
                placeholder="Tìm kiếm bài hát, nghệ sĩ, album..."
                className="w-96 rounded-full bg-white/5 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-400"
            />

            {/* User menu */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">{user?.display_name}</span>
                <button
                    onClick={() => void logout()}
                    className="rounded-full bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                    Đăng xuất
                </button>
            </div>
        </header>
    );
};

