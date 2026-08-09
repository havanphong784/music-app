import prisma from "../../../config/db";
import {Response} from "express";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import cloudinary from "../../../config/cloudinary";

const formatTrack = (track: any) => {
    if (!track) return null;
    return {
        ...track,
        play_count: track.play_count !== undefined && track.play_count !== null ? Number(track.play_count) : 0
    };
};

export const getTracks = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
        const q = (req.query.q as string)?.trim();
        const albumId = req.query.album_id as string;
        const genreId = req.query.genre_id ? parseInt(req.query.genre_id as string) : undefined;

        const whereCondition: any = {};

        if (q) {
            whereCondition.title = {contains: q, mode: "insensitive"};
        }

        if (albumId) {
            whereCondition.album_id = albumId;
        }

        if (genreId !== undefined && !isNaN(genreId)) {
            whereCondition.track_genres = {
                some: {
                    genre_id: genreId
                }
            };
        }

        const total = await prisma.tracks.count({where: whereCondition});
        const tracksRaw = await prisma.tracks.findMany({
            where: whereCondition,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {created_at: "desc"},
            include: {
                albums: true,
                track_artists: {
                    include: {
                        artists: true
                    }
                },
                track_genres: {
                    include: {
                        genres: true
                    }
                }
            }
        });

        const tracks = tracksRaw.map(formatTrack);

        return res.status(200).json({
            tracks,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getTrackById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const track = await prisma.tracks.findUnique({
            where: {id},
            include: {
                albums: true,
                track_artists: {
                    include: {
                        artists: true
                    }
                },
                track_genres: {
                    include: {
                        genres: true
                    }
                }
            }
        });

        if (!track) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        return res.status(200).json({track: formatTrack(track)});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const streamTrack = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const track = await prisma.tracks.findUnique({
            where: {id}
        });

        if (!track) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        if (!track.audio_url) {
            return res.status(404).json({message: "Bài hát chưa có file âm thanh"});
        }

        // Compute expires_at timestamp 15 minutes in future (900 seconds)
        const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;

        // Generate signed URL for authenticated Cloudinary asset
        const streamUrl = cloudinary.url(track.audio_url, {
            resource_type: "video",
            type: "authenticated",
            sign_url: true,
            expires_at: expiresAt
        });

        if (req.query.redirect === "true") {
            return res.redirect(streamUrl);
        }

        return res.status(200).json({
            stream_url: streamUrl,
            expires_at: expiresAt,
            expires_in_seconds: 900
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi tạo đường dẫn stream nhạc"});
    }
};

export const createTrack = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {title, duration_seconds, audio_url, lyrics, album_id, artist_id} = req.body;

        let parsedLyrics = null;
        if (lyrics) {
            try {
                parsedLyrics = typeof lyrics === "string" ? JSON.parse(lyrics) : lyrics;
            } catch {
                parsedLyrics = lyrics;
            }
        }

        const track = await prisma.tracks.create({
            data: {
                title: title.trim(),
                duration_seconds: Number(duration_seconds) || 0,
                audio_url: audio_url || "",
                lyrics: parsedLyrics,
                album_id: album_id || null
            }
        });

        if (artist_id) {
            await prisma.track_artists.create({
                data: {
                    track_id: track.id,
                    artist_id,
                    role: "primary"
                }
            });
        }

        return res.status(201).json({message: "Tạo bài hát mới thành công", track: formatTrack(track)});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const updateTrack = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const {title, duration_seconds, audio_url, lyrics, album_id} = req.body;

        const existTrack = await prisma.tracks.findUnique({where: {id}});
        if (!existTrack) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title.trim();
        if (duration_seconds !== undefined) updateData.duration_seconds = Number(duration_seconds);
        if (audio_url !== undefined) updateData.audio_url = audio_url;
        if (album_id !== undefined) updateData.album_id = album_id || null;

        if (lyrics !== undefined) {
            try {
                updateData.lyrics = typeof lyrics === "string" ? JSON.parse(lyrics) : lyrics;
            } catch {
                updateData.lyrics = lyrics;
            }
        }

        const updatedTrack = await prisma.tracks.update({
            where: {id},
            data: updateData
        });

        return res.status(200).json({message: "Cập nhật bài hát thành công", track: formatTrack(updatedTrack)});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const deleteTrack = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const existTrack = await prisma.tracks.findUnique({where: {id}});
        if (!existTrack) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        await prisma.tracks.delete({where: {id}});
        return res.status(200).json({message: "Xóa bài hát thành công"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const recordPlay = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const existTrack = await prisma.tracks.findUnique({where: {id}});
        if (!existTrack) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        const updatedTrack = await prisma.tracks.update({
            where: {id},
            data: {
                play_count: {
                    increment: 1
                }
            }
        });

        if (req.user?.userId) {
            await prisma.play_history.create({
                data: {
                    user_id: req.user.userId,
                    track_id: id
                }
            });
        }

        return res.status(200).json({
            message: "Ghi nhận lượt phát thành công",
            play_count: Number(updatedTrack.play_count)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const addTrackArtist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const {artist_id, role} = req.body;

        const existTrack = await prisma.tracks.findUnique({where: {id}});
        if (!existTrack) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        const existArtist = await prisma.artists.findUnique({where: {id: artist_id}});
        if (!existArtist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        const trackArtist = await prisma.track_artists.upsert({
            where: {
                track_id_artist_id: {
                    track_id: id,
                    artist_id
                }
            },
            update: {
                role: role || "primary"
            },
            create: {
                track_id: id,
                artist_id,
                role: role || "primary"
            }
        });

        return res.status(200).json({message: "Gán nghệ sĩ cho bài hát thành công", track_artist: trackArtist});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const removeTrackArtist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const artistId = req.params.artistId as string;

        const existTrackArtist = await prisma.track_artists.findUnique({
            where: {
                track_id_artist_id: {
                    track_id: id,
                    artist_id: artistId
                }
            }
        });

        if (!existTrackArtist) {
            return res.status(404).json({message: "Liên kết nghệ sĩ và bài hát không tồn tại"});
        }

        await prisma.track_artists.delete({
            where: {
                track_id_artist_id: {
                    track_id: id,
                    artist_id: artistId
                }
            }
        });

        return res.status(200).json({message: "Đã gỡ nghệ sĩ khỏi bài hát"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const addTrackGenre = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const genreId = Number(req.body.genre_id);

        const existTrack = await prisma.tracks.findUnique({where: {id}});
        if (!existTrack) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        const existGenre = await prisma.genres.findUnique({where: {id: genreId}});
        if (!existGenre) {
            return res.status(404).json({message: "Thể loại nhạc không tồn tại"});
        }

        const trackGenre = await prisma.track_genres.upsert({
            where: {
                track_id_genre_id: {
                    track_id: id,
                    genre_id: genreId
                }
            },
            update: {},
            create: {
                track_id: id,
                genre_id: genreId
            }
        });

        return res.status(200).json({message: "Gán thể loại nhạc cho bài hát thành công", track_genre: trackGenre});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const removeTrackGenre = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const genreId = Number(req.params.genreId);

        const existTrackGenre = await prisma.track_genres.findUnique({
            where: {
                track_id_genre_id: {
                    track_id: id,
                    genre_id: genreId
                }
            }
        });

        if (!existTrackGenre) {
            return res.status(404).json({message: "Liên kết thể loại và bài hát không tồn tại"});
        }

        await prisma.track_genres.delete({
            where: {
                track_id_genre_id: {
                    track_id: id,
                    genre_id: genreId
                }
            }
        });

        return res.status(200).json({message: "Đã bỏ thể loại nhạc khỏi bài hát"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};
