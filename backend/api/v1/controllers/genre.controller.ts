import prisma from "../../../config/db";
import {Response} from "express";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {buildPaginationMeta, parsePagination} from "../utils/pagination.utils";
import {generateUniqueGenreSlug} from "../utils/slug.utils";
import {formatTrack} from "../utils/response.utils";

export const getGenres = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {page, limit, skip, take} = parsePagination(req.query);
        const q = (req.query.q as string)?.trim();

        const whereCondition = q
            ? {
                OR: [
                    {name: {contains: q, mode: "insensitive" as const}},
                    {slug: {contains: q, mode: "insensitive" as const}}
                ]
            }
            : {};

        const total = await prisma.genres.count({where: whereCondition});
        const genres = await prisma.genres.findMany({
            where: whereCondition,
            skip,
            take,
            orderBy: {name: "asc"}
        });

        return res.status(200).json({
            genres,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getGenreByIdOrSlug = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const idOrSlug = req.params.idOrSlug as string;
        const isNumeric = !isNaN(Number(idOrSlug)) && Number.isInteger(Number(idOrSlug));

        const genre = await prisma.genres.findUnique({
            where: isNumeric ? {id: Number(idOrSlug)} : {slug: idOrSlug}
        });

        if (!genre) {
            return res.status(404).json({message: "Thể loại nhạc không tồn tại"});
        }

        return res.status(200).json({genre});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getGenreTracks = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const idOrSlug = req.params.idOrSlug as string;
        const isNumeric = !isNaN(Number(idOrSlug)) && Number.isInteger(Number(idOrSlug));

        const genre = await prisma.genres.findUnique({
            where: isNumeric ? {id: Number(idOrSlug)} : {slug: idOrSlug}
        });

        if (!genre) {
            return res.status(404).json({message: "Thể loại nhạc không tồn tại"});
        }

        const {page, limit, skip, take} = parsePagination(req.query);

        const total = await prisma.track_genres.count({
            where: {genre_id: genre.id}
        });

        const trackGenres = await prisma.track_genres.findMany({
            where: {genre_id: genre.id},
            skip,
            take,
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

        const tracks = trackGenres.map(tg => formatTrack(tg.tracks)).filter(Boolean);

        return res.status(200).json({
            genre,
            tracks,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const createGenre = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {name, slug} = req.body;
        const trimName = name.trim();

        const existName = await prisma.genres.findUnique({
            where: {name: trimName}
        });

        if (existName) {
            return res.status(400).json({message: "Tên thể loại nhạc đã tồn tại"});
        }

        const uniqueSlug = await generateUniqueGenreSlug(slug || trimName);

        const genre = await prisma.genres.create({
            data: {
                name: trimName,
                slug: uniqueSlug
            }
        });

        return res.status(201).json({message: "Tạo thể loại nhạc mới thành công", genre});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const updateGenre = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const {name, slug} = req.body;

        const existGenre = await prisma.genres.findUnique({where: {id}});
        if (!existGenre) {
            return res.status(404).json({message: "Thể loại nhạc không tồn tại"});
        }

        const updateData: {name?: string; slug?: string} = {};

        if (name !== undefined) {
            const trimName = name.trim();
            const existName = await prisma.genres.findFirst({
                where: {
                    name: trimName,
                    NOT: {id}
                }
            });
            if (existName) {
                return res.status(400).json({message: "Tên thể loại nhạc đã tồn tại"});
            }
            updateData.name = trimName;
        }

        if (slug !== undefined || name !== undefined) {
            const targetSlug = slug || updateData.name || existGenre.name;
            updateData.slug = await generateUniqueGenreSlug(targetSlug, id);
        }

        const updatedGenre = await prisma.genres.update({
            where: {id},
            data: updateData
        });

        return res.status(200).json({message: "Cập nhật thể loại nhạc thành công", genre: updatedGenre});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const deleteGenre = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const existGenre = await prisma.genres.findUnique({where: {id}});
        if (!existGenre) {
            return res.status(404).json({message: "Thể loại nhạc không tồn tại"});
        }

        await prisma.genres.delete({where: {id}});
        return res.status(200).json({message: "Xóa thể loại nhạc thành công"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};
