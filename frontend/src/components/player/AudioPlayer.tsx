import {useEffect, useRef} from 'react';
import {usePlayer} from '../../contexts/PlayerContext';
import {useStreamUrl} from '../../hooks/useTracks';

export const AudioPlayer = () => {
    const {
        currentTrack,
        isPlaying,
        volume,
        isMuted,
        currentTime,
        seekId,
        setPlaying,
        setTime,
        setDuration,
        next,
    } = usePlayer();

    // Fetch stream URL CHỈ khi có currentTrack (enabled gate)
    const {data: streamData} = useStreamUrl(currentTrack?.id ?? '', !!currentTrack);
    // Nếu không có track hiện tại -> không có URL (tránh dùng URL cũ của track trước)
    const streamUrl = currentTrack ? streamData?.stream_url : undefined;

    const audioRef = useRef<HTMLAudioElement>(null);

    // 1. Khi URL đổi (chuyển track) -> gán src + load + play nếu đang playing
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !streamUrl) return;
        audio.src = streamUrl;
        audio.load();
        if (isPlaying) void audio.play().catch(() => {
        });
    }, [streamUrl, isPlaying]);

    // 2. Khi isPlaying đổi -> play hoặc pause
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !streamUrl) return;
        if (isPlaying) void audio.play().catch(() => {
        });
        else audio.pause();
    }, [isPlaying, streamUrl]);

    // 3. Khi âm lượng / mute đổi -> set volume của element
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    // 4. SEEK: chỉ chạy khi seekId đổi, đọc currentTime làm target.
    // FE: KHÔNG phụ thuộc currentTime -> tránh loop với onTimeUpdate.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = currentTime;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seekId]);

    // 5. Media Session API: metadata + nút điều khiển OS
    useEffect(() => {
        if (!currentTrack) return;
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.track_artists
                    .map((ta) => ta.artists.name)
                    .join(', '),
                album: currentTrack.albums?.title ?? '',
                artwork: currentTrack.albums?.cover_url
                    ? [{src: currentTrack.albums.cover_url, sizes: '512x512', type: 'image/jpeg'}]
                    : [],
            });

            navigator.mediaSession.setActionHandler('play', () => setPlaying(true));
            navigator.mediaSession.setActionHandler('pause', () => setPlaying(false));
            navigator.mediaSession.setActionHandler('nexttrack', () => next());
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                // prev có logic 3s -> dispatch từ context, ở đây đơn giản next/prev
            });
        }
    }, [currentTrack, setPlaying, next]);

    // Render <audio> ẩn (không có UI), gắn event handler
    return (
        <audio
            ref={audioRef}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(Math.floor(e.currentTarget.currentTime))}
            onLoadedMetadata={(e) => setDuration(Math.floor(e.currentTarget.duration))}
            onEnded={() => next()}
        />
    );
};