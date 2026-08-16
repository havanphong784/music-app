import {Link, useParams} from 'react-router-dom';
import {useTrack} from '../hooks/useTracks';
import {usePlayer} from '../contexts/PlayerContext';

// format lời bài hát JSON -> mảng dòng
interface LyricLine {
    time: number;
    text: string;
}

export const TrackDetailPage = () => {
    const {id} = useParams<{ id: string }>();
    const {data: track, isLoading, error} = useTrack(id ?? '');
    const {play, currentTrack, isPlaying, togglePlay} = usePlayer();

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-lime-400"/>
            </div>
        );
    }

    if (error) {
        return <p className="p-6 text-red-400">Không tải được bài hát. {(error as Error).message}</p>;
    }

    if (!track) {
        return <p className="p-6 text-zinc-400">Bài hát không tồn tại.</p>;
    }

    const cover = track.albums?.cover_url ?? '';
    const artists = track.track_artists.map(ta => ta.artists.name).join(', ');
    const isCurrent = currentTrack?.id === track.id;
    const isThisPlaying = isCurrent && isPlaying;
    const lyrics = Array.isArray(track.lyrics) ? (track.lyrics as LyricLine[]) : [];

    return (
        <div className="p-6">
            {/* Header: cover + info + play */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                {cover ? (
                    <img src={cover} alt={track.title} className="h-48 w-48 rounded-lg object-cover shadow-xl"/>
                ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                        <svg className="h-20 w-20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 18V5l12-2v13"/>
                            <circle cx="6" cy="18" r="3"/>
                            <circle cx="18" cy="16" r="3"/>
                        </svg>
                    </div>
                )}

                <div className="flex-1">
                    <p className="text-sm text-zinc-400">Bài hát</p>
                    <h1 className="mb-2 text-4xl font-bold">{track.title}</h1>
                    <p className="mb-4 text-zinc-400">
                        {artists}
                        {track.albums && (
                            <> • <Link to={`/album/${track.albums.id}`}
                                       className="text-lime-400 hover:underline">{track.albums.title}</Link></>
                        )}
                    </p>

                    {/* Nút play chính lớn */}
                    <button
                        onClick={() => (isCurrent ? togglePlay() : play(track))}
                        className="flex items-center gap-2 rounded-full bg-lime-400 px-8 py-3 font-bold text-zinc-950 transition hover:bg-lime-300"
                    >
                        {isThisPlaying ? (
                            <>
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16"/>
                                    <rect x="14" y="4" width="4" height="16"/>
                                </svg>
                                Tạm dừng
                            </>
                        ) : (
                            <>
                                <svg className="ml-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                Phát
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Thông tin phụ */}
            <div className="mt-8 flex gap-8 text-sm text-zinc-400">
                <span>Lượt nghe: <span className="text-white">{track.play_count}</span></span>
                {track.duration_seconds && (
                    <span>Thời lượng: <span
                        className="text-white">{Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, '0')}</span></span>
                )}
            </div>

            {/* Lời bài hát */}
            {lyrics.length > 0 && (
                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-bold">Lời bài hát</h2>
                    <div className="max-h-96 overflow-y-auto rounded-xl bg-white/5 p-6">
                        {lyrics.map((line, i) => (
                            <p key={i} className="mb-2 leading-7 text-zinc-300">{line.text}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};