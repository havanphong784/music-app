import {usePlayer} from '../../contexts/PlayerContext';

export const PlayerBar = () => {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        togglePlay,
        prev,
        next,
        seek,
        setVolume,
        toggleMute,
    } = usePlayer();

    if (!currentTrack) return null; // ẩn khi chưa phát

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const artists = currentTrack.track_artists.map(ta => ta.artists.name).join(', ');
    const cover = currentTrack.albums?.cover_url ?? '';

    return (
        <div
            className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/95 backdrop-blur border-t border-white/10 flex items-center gap-4 px-4 z-50">
            {/* Cover */}
            {cover && <img src={cover} alt="" className="h-16 w-16 rounded object-cover"/>}

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                <p className="text-white truncate font-medium">{currentTrack.title}</p>
                <p className="text-zinc-400 text-sm truncate">{artists}</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 w-64">
                <span className="text-xs text-zinc-500 w-10 text-right">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0" max="100" value={progress}
                    onChange={e => seek((Number(e.target.value) / 100) * duration)}
                    className="flex-1 h-2 accent-lime-500 cursor-pointer"
                />
                <span className="text-xs text-zinc-500 w-10">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                <button onClick={prev} className="text-zinc-300 hover:text-white p-1" aria-label="Previous">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5-6l8.5 6-8.5 6V0z"/>
                    </svg>
                </button>
                <button onClick={togglePlay} className="text-white p-2 rounded-full bg-lime-500 hover:bg-lime-400"
                        aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? (
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"/>
                            <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                    ) : (
                        <svg className="h-6 w-6 ml-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    )}
                </button>
                <button onClick={next} className="text-zinc-300 hover:text-white p-1" aria-label="Next">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5-6l8.5 6-8.5 6V0z"/>
                    </svg>
                </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 ml-auto">
                <button onClick={toggleMute} className="text-zinc-300 hover:text-white p-1"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted || volume === 0 ? (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                            <line x1="23" y1="9" x2="17" y2="15"/>
                            <line x1="17" y1="9" x2="23" y2="15"/>
                        </svg>
                    ) : volume < 0.5 ? (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                    )}
                </button>
                <input
                    type="range"
                    min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                    onChange={e => setVolume(Number(e.target.value))}
                    className="w-24 h-2 accent-lime-500 cursor-pointer"
                />
            </div>
        </div>
    );
};