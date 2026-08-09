import prisma from "../config/db";
import {Response} from "express";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {buildPaginationMeta, parsePagination} from "../utils/pagination";
import {formatTrack} from "../utils/response";
import {destroyStoredAsset} from "../utils/cloudinary-asset";

export const getArtists = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {page, limit, skip, take} = parsePagination(req.query);
        const q = (req.query.q as string)?.trim();
        const verifiedQuery = req.query.verified;

        const whereCondition: any = {};

        if (q) {
            whereCondition.name = {contains: q, mode: "insensitive"};
        }

        if (verifiedQuery !== undefined) {
            whereCondition.verified = String(verifiedQuery) === "true";
        }

        const total = await prisma.artists.count({where: whereCondition});
        const artists = await prisma.artists.findMany({
            where: whereCondition,
            skip,
            take,
            orderBy: {name: "asc"}
        });

        return res.status(200).json({
            artists,
            pagination: buildPaginationMeta(total, page, limit)
        });
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getArtistById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const artist = await prisma.artists.findUnique({
            where: {id}
        });

        if (!artist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        return res.status(200).json({artist});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getArtistTracks = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const existArtist = await prisma.artists.findUnique({where: {id}});
        if (!existArtist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        const trackArtists = await prisma.track_artists.findMany({
            where: {artist_id: id},
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

        const tracks = trackArtists.map(ta => formatTrack(ta.tracks)).filter(Boolean);
        return res.status(200).json({tracks});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getArtistAlbums = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const existArtist = await prisma.artists.findUnique({where: {id}});
        if (!existArtist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        const albums = await prisma.albums.findMany({
            where: {
                tracks: {
                    some: {
                        track_artists: {
                            some: {
                                artist_id: id
                            }
                        }
                    }
                }
            },
            orderBy: {release_date: "desc"}
        });

        return res.status(200).json({albums});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const createArtist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {name, bio, avatar_url, verified} = req.body;

        const artist = await prisma.artists.create({
            data: {
                name: name.trim(),
                bio: bio ? bio.trim() : null,
                avatar_url: avatar_url || null,
                avatar_public_id: req.uploadedAsset?.publicId || null,
                verified: String(verified) === "true"
            }
        });

        return res.status(201).json({message: "Tạo hồ sơ nghệ sĩ mới thành công", artist});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const updateArtist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const {name, bio, avatar_url, verified} = req.body;

        const existArtist = await prisma.artists.findUnique({where: {id}});
        if (!existArtist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (bio !== undefined) updateData.bio = bio ? bio.trim() : null;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
        if (req.uploadedAsset) updateData.avatar_public_id = req.uploadedAsset.publicId;
        else if (avatar_url !== undefined) updateData.avatar_public_id = null;
        if (verified !== undefined && req.user?.role === "admin") {
            updateData.verified = String(verified) === "true";
        }

        const updatedArtist = await prisma.artists.update({
            where: {id},
            data: updateData
        });

        if (existArtist.avatar_public_id !== updatedArtist.avatar_public_id) {
            await destroyStoredAsset(existArtist.avatar_public_id, "image");
        }

        return res.status(200).json({message: "Cập nhật thông tin nghệ sĩ thành công", artist: updatedArtist});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const deleteArtist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const existArtist = await prisma.artists.findUnique({where: {id}});
        if (!existArtist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        await prisma.artists.delete({where: {id}});
        await destroyStoredAsset(existArtist.avatar_public_id, "image");
        return res.status(200).json({message: "Xóa hồ sơ nghệ sĩ thành công"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getArtistMembers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const existArtist = await prisma.artists.findUnique({where: {id}});
        if (!existArtist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        const members = await prisma.artist_members.findMany({
            where: {artist_id: id},
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        display_name: true,
                        avatar_url: true,
                        role: true
                    }
                }
            }
        });

        return res.status(200).json({members});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const addArtistMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const {user_id, role} = req.body;

        const existArtist = await prisma.artists.findUnique({where: {id}});
        if (!existArtist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }

        const existUser = await prisma.users.findUnique({where: {id: user_id}});
        if (!existUser) {
            return res.status(404).json({message: "Người dùng không tồn tại"});
        }

        const member = await prisma.artist_members.upsert({
            where: {
                user_id_artist_id: {
                    user_id,
                    artist_id: id
                }
            },
            update: {
                role: role || "manager"
            },
            create: {
                user_id,
                artist_id: id,
                role: role || "manager"
            },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        display_name: true,
                        avatar_url: true
                    }
                }
            }
        });

        return res.status(200).json({message: "Phân quyền quản lý nghệ sĩ thành công", member});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const removeArtistMember = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.params.userId as string;

        const existMember = await prisma.artist_members.findUnique({
            where: {
                user_id_artist_id: {
                    user_id: userId,
                    artist_id: id
                }
            }
        });

        if (!existMember) {
            return res.status(404).json({message: "Thành viên không tồn tại trong danh sách quản lý nghệ sĩ"});
        }

        await prisma.artist_members.delete({
            where: {
                user_id_artist_id: {
                    user_id: userId,
                    artist_id: id
                }
            }
        });

        return res.status(200).json({message: "Thu hồi quyền quản lý nghệ sĩ thành công"});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};
