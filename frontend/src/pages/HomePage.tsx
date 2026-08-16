import {useTracks} from '../hooks/useTracks';
import {TrackCard} from '../components/track/TrackCard';

export const HomePage = () => {
    const {data, isLoading, error} = useTracks({page: 1, limit: 20});

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl bg-white/5 p-3">
                        <div className="aspect-square w-full rounded-lg bg-zinc-800"/>
                        <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800"/>
                        <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800"/>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-red-400">Lỗi tải bài hát. {(error as Error).message}</p>;
    }

    if (!data || data.tracks.length === 0) {
        return <p className="text-zinc-400">Chưa có bài hát nào.</p>;
    }

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold">Bài hát</h1>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {data.tracks.map(track => (
                    <TrackCard key={track.id} track={track}/>
                ))}
            </div>
        </div>
    );
};