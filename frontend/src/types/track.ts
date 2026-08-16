export interface TrackArtist {
    track_id: string;
    artist_id: string;
    role: 'primary' | 'featured';
    artists: {
        id: string;
        name: string;
        avatar_url: string | null;
        verified: boolean;
    };
}

export interface TrackGenre {
    track_id: string;
    genre_id: number;
    genres: {
        id: number;
        name: string;
        slug: string;
    };
}

export interface AlbumRef {
    id: string;
    title: string;
    cover_url: string | null;
    release_date: string | null;
    artist_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Track {
    id: string;
    title: string;
    duration_seconds: number | null;
    audio_url: string;
    lyrics: any | null;
    play_count: string;          // BigInt -> string
    album_id: string | null;
    created_at: string;
    updated_at: string;
    albums: AlbumRef | null;
    track_artists: TrackArtist[];
    track_genres: TrackGenre[];
}

export interface TrackListResponse {
    tracks: Track[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface StreamResponse {
    stream_url: string;
    expires_at: string | null;        // unix timestamp string hoặc null
    expires_in_seconds: number | null;
}