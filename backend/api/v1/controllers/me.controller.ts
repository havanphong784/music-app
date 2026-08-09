import prisma from "../../../config/db";
import {Response} from "express";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {buildPaginationMeta, parsePagination} from "../utils/pagination.utils";
import {formatTrack} from "../utils/response.utils";

export const getMyPlaylists = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        const {page, limit, skip, take} = parsePagination(req.query);

        const total = await prisma.playlists.count({where: {user_id: userId}});
        const playlists = await prisma.playlists.findMany({
            where: {user_id: userId},
            skip,
            take,
            orderBy: {created_at: "desc"}
        });

        return res.status(200).json({
            playlists,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getFavoriteTracks = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        const {page, limit, skip, take} = parsePagination(req.query);

        const total = await prisma.user_favorite_tracks.count({where: {user_id: userId}});
        const favoriteTracksRaw = await prisma.user_favorite_tracks.findMany({
            where: {user_id: userId},
            skip,
            take,
            orderBy: {created_at: "desc"},
            include: {
                tracks: {
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
                }
            }
        });

        const favorite_tracks = favoriteTracksRaw.map(ft => ({
            ...ft,
            tracks: formatTrack(ft.tracks)
        }));

        return res.status(200).json({
            favorite_tracks,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const addFavoriteTrack = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        const trackId = req.params.trackId as string;
        const existTrack = await prisma.tracks.findUnique({where: {id: trackId}});
        if (!existTrack) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        const favorite = await prisma.user_favorite_tracks.upsert({
            where: {
                user_id_track_id: {
                    user_id: userId,
                    track_id: trackId
                }
            },
            update: {},
            create: {
                user_id: userId,
                track_id: trackId
            }
        });

        return res.status(201).json({message: "Đã thêm bài hát vào danh sách yêu thích", favorite});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const removeFavoriteTrack = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        const trackId = req.params.trackId as string;
        const existFavorite = await prisma.user_favorite_tracks.findUnique({
            where: {
                user_id_track_id: {
                    user_id: userId,
                    track_id: trackId
                }
            }
        });

        if (!existFavorite) {
            return res.status(404).json({message: "Bài hát chưa có trong danh sách yêu thích"});
        }

        await prisma.user_favorite_tracks.delete({
            where: {
                user_id_track_id: {
                    user_id: userId,
                    track_id: trackId
                }
            }
        });

        return res.status(200).json({message: "Đã bỏ yêu thích bài hát"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getFollowedArtists = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        const {page, limit, skip, take} = parsePagination(req.query);

        const total = await prisma.user_followed_artists.count({where: {user_id: userId}});
        const followed = await prisma.user_followed_artists.findMany({
            where: {user_id: userId},
            skip,
            take,
            orderBy: {created_at: "desc"},
            include: {
                artists: true
            }
        });

        return res.status(200).json({
            followed_artists: followed,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const followArtist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        const artistId = req.params.artistId as string;
        const existArtist = await prisma.artists.findUnique({where: {id: artistId}});
        if (!existArtist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        const follow = await prisma.user_followed_artists.upsert({
            where: {
                user_id_artist_id: {
                    user_id: userId,
                    artist_id: artistId
                }
            },
            update: {},
            create: {
                user_id: userId,
                artist_id: artistId
            }
        });

        return res.status(201).json({message: "Đã theo dõi nghệ sĩ", follow});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const unfollowArtist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        const artistId = req.params.artistId as string;
        const existFollow = await prisma.user_followed_artists.findUnique({
            where: {
                user_id_artist_id: {
                    user_id: userId,
                    artist_id: artistId
                }
            }
        });

        if (!existFollow) {
            return res.status(404).json({message: "Chưa theo dõi nghệ sĩ này"});
        }

        await prisma.user_followed_artists.delete({
            where: {
                user_id_artist_id: {
                    user_id: userId,
                    artist_id: artistId
                }
            }
        });

        return res.status(200).json({message: "Đã bỏ theo dõi nghệ sĩ"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getListeningHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        const {page, limit, skip, take} = parsePagination(req.query);

        const total = await prisma.play_history.count({where: {user_id: userId}});
        const historyRaw = await prisma.play_history.findMany({
            where: {user_id: userId},
            skip,
            take,
            orderBy: {played_at: "desc"},
            include: {
                tracks: {
                    include: {
                        albums: true,
                        track_artists: {
                            include: {
                                artists: true
                            }
                        }
                    }
                }
            }
        });

        const history = historyRaw.map(item => ({
            ...item,
            id: Number(item.id),
            tracks: formatTrack(item.tracks)
        }));

        return res.status(200).json({
            history,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const clearListeningHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({message: "Chưa xác thực"});

        await prisma.play_history.deleteMany({
            where: {user_id: userId}
        });

        return res.status(200).json({message: "Đã xóa toàn bộ lịch sử nghe nhạc"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};
