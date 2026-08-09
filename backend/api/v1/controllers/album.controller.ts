import prisma from "../../../config/db";
import {Response} from "express";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {buildPaginationMeta, parsePagination} from "../utils/pagination.utils";
import {formatTrack} from "../utils/response.utils";

export const getAlbums = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {page, limit, skip, take} = parsePagination(req.query);
        const q = (req.query.q as string)?.trim();
        const sort = req.query.sort as string;

        const whereCondition: any = {};
        if (q) {
            whereCondition.title = {contains: q, mode: "insensitive"};
        }

        let orderBy: any = {created_at: "desc"};
        if (sort === "newest") {
            orderBy = {release_date: "desc"};
        } else if (sort === "oldest") {
            orderBy = {release_date: "asc"};
        } else if (sort === "title_asc") {
            orderBy = {title: "asc"};
        } else if (sort === "title_desc") {
            orderBy = {title: "desc"};
        }

        const total = await prisma.albums.count({where: whereCondition});
        const albums = await prisma.albums.findMany({
            where: whereCondition,
            skip,
            take,
            orderBy
        });

        return res.status(200).json({
            albums,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getAlbumById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const album = await prisma.albums.findUnique({
            where: {id},
            include: {
                tracks: {
                    include: {
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

        if (!album) {
            return res.status(404).json({message: "Album không tồn tại"});
        }

        return res.status(200).json({
            album: {
                ...album,
                tracks: album.tracks.map(formatTrack)
            }
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const createAlbum = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {title, cover_url, release_date} = req.body;

        const album = await prisma.albums.create({
            data: {
                title: title.trim(),
                cover_url: cover_url || null,
                release_date: release_date ? new Date(release_date) : null
            }
        });

        return res.status(201).json({message: "Tạo album mới thành công", album});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const updateAlbum = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const {title, cover_url, release_date} = req.body;

        const existAlbum = await prisma.albums.findUnique({where: {id}});
        if (!existAlbum) {
            return res.status(404).json({message: "Album không tồn tại"});
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title.trim();
        if (cover_url !== undefined) updateData.cover_url = cover_url;
        if (release_date !== undefined) updateData.release_date = release_date ? new Date(release_date) : null;

        const updatedAlbum = await prisma.albums.update({
            where: {id},
            data: updateData
        });

        return res.status(200).json({message: "Cập nhật thông tin album thành công", album: updatedAlbum});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const deleteAlbum = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const existAlbum = await prisma.albums.findUnique({where: {id}});
        if (!existAlbum) {
            return res.status(404).json({message: "Album không tồn tại"});
        }

        await prisma.albums.delete({where: {id}});
        return res.status(200).json({message: "Xóa album thành công"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};
