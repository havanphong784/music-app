import type {Track} from '../../types/track';
import {usePlayer} from '../../contexts/PlayerContext';
import {Link} from 'react-router-dom';

export const TrackCard = ({track}: { track: Track }) => {
    const {play, currentTrack, isPlaying} = usePlayer();

    const cover = track.albums?.cover_url ?? '';
    const artists = track.track_artists.map(ta => ta.artists.name).join(', ');
    const isCurrent = currentTrack?.id === track.id;
    const showPlaying = isCurrent && isPlaying;   // đang phát chính track này

    return (
        <Link to={`/track/${track.id}`}
              className="group relative block rounded-xl bg-white/5 p-3 transition hover:bg-white/10">
            <div className="relative mb-3">
                {cover ? (
                    <img src={cover} alt={track.title} className="aspect-square w-full rounded-lg object-cover"/>
                ) : (
                    <div
                        className="flex aspect-square w-full items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 18V5l12-2v13"/>
                            <circle cx="6" cy="18" r="3"/>
                            <circle cx="18" cy="16" r="3"/>
                        </svg>
                    </div>
                )}

                {/* Nút play overlay, hiện khi hover hoặc đang phát */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        play(track);
                    }}
                    className={`absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-lime-400 text-zinc-950 shadow-lg transition hover:bg-lime-300 hover:scale-105 ${
                        showPlaying ? 'opacity-100' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
                    aria-label="Phát"
                >
                    {showPlaying ? (
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"/>
                            <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                    ) : (
                        <svg className="ml-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    )}
                </button>
            </div>

            <p className={`truncate font-medium ${showPlaying ? 'text-lime-400' : 'text-white'}`}>{track.title}</p>
            <p className="truncate text-sm text-zinc-400">{artists}</p>
        </Link>
    );
};