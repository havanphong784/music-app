import {NextFunction, Request, Response} from "express";
import {IPayload, verifyAccessToken} from "../utils/jwt.utils";
import prisma from "../../../config/db";
import type {UploadedCloudinaryAsset} from "../utils/cloudinaryAsset.utils";

export interface AuthenticatedRequest extends Request {
    user?: IPayload;
    uploadedAsset?: UploadedCloudinaryAsset;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({message: "Chưa có token xác thực"});
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({message: "Token xác thực không hợp lệ"});
    }

    const user = verifyAccessToken(token);
    if (!user) {
        return res.status(401).json({message: "Token xác thực không hợp lệ"});
    }
    try {
        const currentUser = await prisma.users.findUnique({
            where: {id: user.userId},
            select: {id: true, email: true, display_name: true, role: true}
        });

        if (!currentUser) {
            return res.status(401).json({message: "Tài khoản không còn tồn tại"});
        }

        req.user = {
            userId: currentUser.id,
            email: currentUser.email,
            userName: currentUser.display_name,
            role: currentUser.role || "user"
        };
        next();
    } catch (error) {
        next(error);
    }
};

export const requireRole = (requiredRole: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({message: "Chưa xác thực"});
        }
        if (req.user.role !== requiredRole) {
            return res.status(403).json({message: "Bạn không có quyền thực hiện thao tác này"});
        }
        next();
    };
};

export const requireAdmin = requireRole("admin");

export const requireArtistManagerOrAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({message: "Chưa xác thực"});
    }

    if (req.user.role === "admin") {
        return next();
    }

    const artistId = (req.params.id || req.params.artistId) as string;
    if (!artistId) {
        return res.status(400).json({message: "Thiếu ID nghệ sĩ"});
    }

    try {
        const member = await prisma.artist_members.findUnique({
            where: {
                user_id_artist_id: {
                    user_id: req.user.userId,
                    artist_id: artistId
                }
            }
        });

        if (!member || member.role !== "manager") {
            return res.status(403).json({message: "Bạn không có quyền quản lý nghệ sĩ này"});
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const requireTrackManagerOrAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({message: "Chưa xác thực"});
    if (req.user.role === "admin") return next();

    const trackId = req.params.id as string;
    try {
        const managedTrack = await prisma.track_artists.findFirst({
            where: {
                track_id: trackId,
                role: "primary",
                artists: {
                    artist_members: {some: {user_id: req.user.userId, role: "manager"}}
                }
            },
            select: {track_id: true}
        });

        if (!managedTrack) {
            return res.status(403).json({message: "Bạn không có quyền quản lý bài hát này"});
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const requireArtistVerificationPermission = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.body.verified !== undefined && req.user?.role !== "admin") {
        return res.status(403).json({message: "Chỉ Admin được thay đổi trạng thái xác minh"});
    }
    next();
};

export const requireAlbumReassignmentPermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.body.artist_id !== undefined && req.user?.role !== "admin") {
        return res.status(403).json({message: "Chỉ Admin được chuyển album sang nghệ sĩ khác"});
    }
    if (!req.body.artist_id) return next();

    try {
        const artist = await prisma.artists.findUnique({
            where: {id: req.body.artist_id as string},
            select: {id: true}
        });
        if (!artist) return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        next();
    } catch (error) {
        next(error);
    }
};

export const requireTrackCreatorOrAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({message: "Chưa xác thực"});
    if (req.user.role === "admin") return next();

    const artistId = req.body.artist_id as string | undefined;
    if (!artistId) {
        return res.status(400).json({message: "Artist Manager phải cung cấp artist_id"});
    }

    try {
        const member = await prisma.artist_members.findUnique({
            where: {user_id_artist_id: {user_id: req.user.userId, artist_id: artistId}}
        });
        if (!member || member.role !== "manager") {
            return res.status(403).json({message: "Bạn không có quyền tạo bài hát cho nghệ sĩ này"});
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const requireAlbumManagerOrAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({message: "Chưa xác thực"});
    if (req.user.role === "admin") return next();

    try {
        const album = await prisma.albums.findUnique({
            where: {id: req.params.id as string},
            select: {artist_id: true}
        });
        if (!album) return res.status(404).json({message: "Album không tồn tại"});
        if (!album.artist_id) return res.status(403).json({message: "Album chưa được gán nghệ sĩ quản lý"});

        const member = await prisma.artist_members.findUnique({
            where: {user_id_artist_id: {user_id: req.user.userId, artist_id: album.artist_id}}
        });
        if (!member || member.role !== "manager") {
            return res.status(403).json({message: "Bạn không có quyền quản lý album này"});
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const requireAlbumCreatorOrAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({message: "Chưa xác thực"});

    const artistId = req.body.artist_id as string | undefined;
    if (!artistId) {
        return req.user.role === "admin"
            ? next()
            : res.status(400).json({message: "Artist Manager phải cung cấp artist_id"});
    }

    try {
        const artist = await prisma.artists.findUnique({where: {id: artistId}, select: {id: true}});
        if (!artist) return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        if (req.user.role === "admin") return next();

        const member = await prisma.artist_members.findUnique({
            where: {user_id_artist_id: {user_id: req.user.userId, artist_id: artistId}}
        });
        if (!member || member.role !== "manager") {
            return res.status(403).json({message: "Bạn không có quyền tạo album cho nghệ sĩ này"});
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const requirePlaylistOwnerOrAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({message: "Chưa xác thực"});

    try {
        const playlist = await prisma.playlists.findUnique({
            where: {id: req.params.id as string},
            select: {user_id: true}
        });
        if (!playlist) return res.status(404).json({message: "Danh sách phát không tồn tại"});
        if (playlist.user_id !== req.user.userId && req.user.role !== "admin") {
            return res.status(403).json({message: "Bạn không có quyền chỉnh sửa danh sách phát này"});
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        if (token) {
            const user = verifyAccessToken(token);
            if (user) {
                try {
                    const currentUser = await prisma.users.findUnique({
                        where: {id: user.userId},
                        select: {id: true, email: true, display_name: true, role: true}
                    });
                    if (currentUser) {
                        req.user = {
                            userId: currentUser.id,
                            email: currentUser.email,
                            userName: currentUser.display_name,
                            role: currentUser.role || "user"
                        };
                    }
                } catch (error) {
                    return next(error);
                }
            }
        }
    }
    next();
};
