CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "albums" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "cover_url" TEXT,
    "cover_public_id" TEXT,
    "release_date" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "artist_members" (
    "user_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'manager',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "artist_members_pkey" PRIMARY KEY ("user_id", "artist_id"),
    CONSTRAINT "artist_members_role_check" CHECK ("role" = 'manager')
);

CREATE TABLE "artists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "avatar_public_id" TEXT,
    "bio" TEXT,
    "verified" BOOLEAN DEFAULT false,
    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "play_history" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "track_id" UUID,
    "played_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "play_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "playlist_tracks" (
    "playlist_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("playlist_id", "track_id")
);

CREATE TABLE "playlists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "cover_url" TEXT,
    "cover_public_id" TEXT,
    "is_public" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "track_artists" (
    "track_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "role" VARCHAR(20) DEFAULT 'primary',
    CONSTRAINT "track_artists_pkey" PRIMARY KEY ("track_id", "artist_id")
);

CREATE TABLE "track_genres" (
    "track_id" UUID NOT NULL,
    "genre_id" INTEGER NOT NULL,
    CONSTRAINT "track_genres_pkey" PRIMARY KEY ("track_id", "genre_id")
);

CREATE TABLE "tracks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "album_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "audio_url" TEXT NOT NULL,
    "audio_public_id" TEXT,
    "lyrics" JSONB,
    "play_count" BIGINT DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_favorite_tracks" (
    "user_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_favorite_tracks_pkey" PRIMARY KEY ("user_id", "track_id")
);

CREATE TABLE "user_followed_artists" (
    "user_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_followed_artists_pkey" PRIMARY KEY ("user_id", "artist_id")
);

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "avatar_public_id" TEXT,
    "role" VARCHAR(20) DEFAULT 'user',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_albums_artist" ON "albums"("artist_id");
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");
CREATE INDEX "idx_play_history_user" ON "play_history"("user_id", "played_at" DESC);
CREATE UNIQUE INDEX "uq_playlist_tracks_position" ON "playlist_tracks"("playlist_id", "position");
CREATE INDEX "idx_track_artists_artist" ON "track_artists"("artist_id");
CREATE INDEX "idx_tracks_album" ON "tracks"("album_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

ALTER TABLE "albums" ADD CONSTRAINT "albums_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "track_genres" ADD CONSTRAINT "track_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "track_genres" ADD CONSTRAINT "track_genres_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "user_favorite_tracks" ADD CONSTRAINT "user_favorite_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "user_favorite_tracks" ADD CONSTRAINT "user_favorite_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "user_followed_artists" ADD CONSTRAINT "user_followed_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "user_followed_artists" ADD CONSTRAINT "user_followed_artists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
