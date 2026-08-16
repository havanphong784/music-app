import {Outlet} from 'react-router-dom';
import {PlayerProvider} from '../../contexts/PlayerContext';
import {Header} from './Header';
import {Sidebar} from './Sidebar';
import {AudioPlayer} from '../player/AudioPlayer';
import {PlayerBar} from '../player/PlayerBar';

export const AppLayout = () => {
    return (
        <PlayerProvider>
            <div className="flex h-screen flex-col bg-[#090a0c] text-white">
                <Header/>
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar/>
                    <main className="flex-1 overflow-y-auto pb-20"> {/* pb-20 = chừa chỗ PlayerBar */}
                        <Outlet/>
                    </main>
                </div>
                <AudioPlayer/>
                <PlayerBar/>
            </div>
        </PlayerProvider>
    );
};