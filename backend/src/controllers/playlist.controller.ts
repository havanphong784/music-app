import prisma from "../config/db";
import {Response} from "express";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {buildPaginationMeta, parsePagination} from "../utils/pagination";
import {formatTrack} from "../utils/response";
import {destroyStoredAsset} from "../utils/cloudinary-asset";

const rewritePlaylistPositions = async (tx: any, playlistId: string, orderedTrackIds: string[]) => {
    for (let index = 0; index < orderedTrackIds.length; index++) {
        await tx.playlist_tracks.update({
            where: {playlist_id_track_id: {playlist_id: playlistId, track_id: orderedTrackIds[index]}},
            data: {position: -(index + 1)}
        });
    }
    for (let index = 0; index < orderedTrackIds.length; index++) {
        await tx.playlist_tracks.update({
            where: {playlist_id_track_id: {playlist_id: playlistId, track_id: orderedTrackIds[index]}},
            data: {position: index + 1}
        });
    }
};

const lockPlaylist = async (tx: any, playlistId: string) => {
    await tx.$queryRaw`SELECT "id" FROM "playlists" WHERE "id" = ${playlistId}::uuid FOR UPDATE`;
};

export const getPublicPlaylists = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {page, limit, skip, take} = parsePagination(req.query);
        const q = (req.query.q as string)?.trim();

        const whereCondition: any = {is_public: true};
        if (q) {
            whereCondition.title = {contains: q, mode: "insensitive"};
        }

        const total = await prisma.playlists.count({where: whereCondition});
        const playlists = await prisma.playlists.findMany({
            where: whereCondition,
            skip,
            take,
            orderBy: {created_at: "desc"},
            include: {
                users: {
                    select: {
                        id: true,
                        display_name: true,
                        avatar_url: true
                    }
                }
            }
        });

        return res.status(200).json({
            playlists,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const createPlaylist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({message: "Chưa xác thực"});
        }

        const {title, cover_url, is_public} = req.body;
        const isPublic = is_public !== undefined ? (String(is_public) === "true" || is_public === true) : true;

        const playlist = await prisma.playlists.create({
            data: {
                user_id: userId,
                title: title.trim(),
                cover_url: cover_url || null,
                cover_public_id: req.uploadedAsset?.publicId || null,
                is_public: isPublic
            }
        });

        return res.status(201).json({message: "Tạo danh sách phát mới thành công", playlist});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getPlaylistById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const playlist = await prisma.playlists.findUnique({
            where: {id},
            include: {
                users: {
                    select: {
                        id: true,
                        display_name: true,
                        avatar_url: true
                    }
                },
                playlist_tracks: {
                    orderBy: {position: "asc"},
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
                }
            }
        });

        if (!playlist) {
            return res.status(404).json({message: "Danh sách phát không tồn tại"});
        }

        if (playlist.is_public === false && playlist.user_id !== userId && userRole !== "admin") {
            return res.status(403).json({message: "Bạn không có quyền xem danh sách phát riêng tư này"});
        }

        const formattedPlaylist = {
            ...playlist,
            playlist_tracks: playlist.playlist_tracks.map(pt => ({
                ...pt,
                tracks: formatTrack(pt.tracks)
            }))
        };

        return res.status(200).json({playlist: formattedPlaylist});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const updatePlaylist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const existPlaylist = await prisma.playlists.findUnique({where: {id}});
        if (!existPlaylist) {
            return res.status(404).json({message: "Danh sách phát không tồn tại"});
        }

        if (existPlaylist.user_id !== userId && userRole !== "admin") {
            return res.status(403).json({message: "Bạn không có quyền chỉnh sửa danh sách phát này"});
        }

        const {title, cover_url, is_public} = req.body;
        const updateData: any = {};

        if (title !== undefined) updateData.title = title.trim();
        if (cover_url !== undefined) updateData.cover_url = cover_url;
        if (req.uploadedAsset) updateData.cover_public_id = req.uploadedAsset.publicId;
        else if (cover_url !== undefined) updateData.cover_public_id = null;
        if (is_public !== undefined) updateData.is_public = String(is_public) === "true" || is_public === true;

        const updatedPlaylist = await prisma.playlists.update({
            where: {id},
            data: updateData
        });

        if (existPlaylist.cover_public_id !== updatedPlaylist.cover_public_id) {
            await destroyStoredAsset(existPlaylist.cover_public_id, "image");
        }

        return res.status(200).json({message: "Cập nhật danh sách phát thành công", playlist: updatedPlaylist});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const deletePlaylist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const existPlaylist = await prisma.playlists.findUnique({where: {id}});
        if (!existPlaylist) {
            return res.status(404).json({message: "Danh sách phát không tồn tại"});
        }

        if (existPlaylist.user_id !== userId && userRole !== "admin") {
            return res.status(403).json({message: "Bạn không có quyền xóa danh sách phát này"});
        }

        await prisma.playlists.delete({where: {id}});
        await destroyStoredAsset(existPlaylist.cover_public_id, "image");
        return res.status(200).json({message: "Xóa danh sách phát thành công"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const addTrackToPlaylist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const existPlaylist = await prisma.playlists.findUnique({where: {id}});
        if (!existPlaylist) {
            return res.status(404).json({message: "Danh sách phát không tồn tại"});
        }

        if (existPlaylist.user_id !== userId && userRole !== "admin") {
            return res.status(403).json({message: "Bạn không có quyền quản lý danh sách phát này"});
        }

        const {track_id, position} = req.body;
        const existTrack = await prisma.tracks.findUnique({where: {id: track_id}});
        if (!existTrack) {
            return res.status(404).json({message: "Bài hát không tồn tại"});
        }

        const playlistTrack = await prisma.$transaction(async tx => {
            await lockPlaylist(tx, id);
            const current = await tx.playlist_tracks.findMany({
                where: {playlist_id: id},
                orderBy: [{position: "asc"}, {added_at: "asc"}],
                select: {track_id: true}
            });
            const orderedIds = current.map(item => item.track_id).filter(existingId => existingId !== track_id);
            const requestedPosition = position === undefined ? orderedIds.length + 1 : Number(position);
            const targetIndex = Math.min(Math.max(requestedPosition - 1, 0), orderedIds.length);

            if (!current.some(item => item.track_id === track_id)) {
                await tx.playlist_tracks.create({
                    data: {playlist_id: id, track_id, position: -(current.length + 1)}
                });
            }

            orderedIds.splice(targetIndex, 0, track_id);
            await rewritePlaylistPositions(tx, id, orderedIds);
            return tx.playlist_tracks.findUnique({
                where: {playlist_id_track_id: {playlist_id: id, track_id}}
            });
        });

        return res.status(201).json({message: "Thêm bài hát vào danh sách phát thành công", playlist_track: playlistTrack});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const reorderPlaylistTracks = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const existPlaylist = await prisma.playlists.findUnique({where: {id}});
        if (!existPlaylist) {
            return res.status(404).json({message: "Danh sách phát không tồn tại"});
        }

        if (existPlaylist.user_id !== userId && userRole !== "admin") {
            return res.status(403).json({message: "Bạn không có quyền quản lý danh sách phát này"});
        }

        const {items} = req.body as {items: Array<{track_id: string; position: number}>};
        const current = await prisma.playlist_tracks.findMany({
            where: {playlist_id: id},
            select: {track_id: true}
        });
        const currentIds = new Set(current.map(item => item.track_id));
        if (items.length !== current.length || items.some(item => !currentIds.has(item.track_id))) {
            return res.status(400).json({message: "items phải chứa đầy đủ các bài hát hiện có trong playlist"});
        }

        const orderedItems = [...items].sort((a, b) => Number(a.position) - Number(b.position));
        if (orderedItems.some((item, index) => Number(item.position) !== index + 1)) {
            return res.status(400).json({message: "position phải là dãy liên tục bắt đầu từ 1"});
        }

        await prisma.$transaction(async tx => {
            await lockPlaylist(tx, id);
            await rewritePlaylistPositions(tx, id, orderedItems.map(item => item.track_id));
        });

        return res.status(200).json({message: "Cập nhật thứ tự bài hát thành công"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const removeTrackFromPlaylist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const trackId = req.params.trackId as string;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const existPlaylist = await prisma.playlists.findUnique({where: {id}});
        if (!existPlaylist) {
            return res.status(404).json({message: "Danh sách phát không tồn tại"});
        }

        if (existPlaylist.user_id !== userId && userRole !== "admin") {
            return res.status(403).json({message: "Bạn không có quyền quản lý danh sách phát này"});
        }

        const existPlaylistTrack = await prisma.playlist_tracks.findUnique({
            where: {
                playlist_id_track_id: {
                    playlist_id: id,
                    track_id: trackId
                }
            }
        });

        if (!existPlaylistTrack) {
            return res.status(404).json({message: "Bài hát không có trong danh sách phát"});
        }

        await prisma.$transaction(async tx => {
            await lockPlaylist(tx, id);
            await tx.playlist_tracks.delete({
                where: {playlist_id_track_id: {playlist_id: id, track_id: trackId}}
            });
            const remaining = await tx.playlist_tracks.findMany({
                where: {playlist_id: id},
                orderBy: [{position: "asc"}, {added_at: "asc"}],
                select: {track_id: true}
            });
            await rewritePlaylistPositions(tx, id, remaining.map(item => item.track_id));
        });

        return res.status(200).json({message: "Đã xóa bài hát khỏi danh sách phát"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};
