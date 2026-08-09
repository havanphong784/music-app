import {NextFunction, Request, Response} from "express";
import {IPayload, verifyAccessToken} from "../utils/jwt.utils";
import prisma from "../../../config/db";

export interface AuthenticatedRequest extends Request {
    user?: IPayload;
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
    req.user = user;
    next();
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

    const member = await prisma.artist_members.findUnique({
        where: {
            user_id_artist_id: {
                user_id: req.user.userId,
                artist_id: artistId
            }
        }
    });

    if (!member) {
        return res.status(403).json({message: "Bạn không có quyền quản lý nghệ sĩ này"});
    }

    next();
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        if (token) {
            const user = verifyAccessToken(token);
            if (user) {
                req.user = user;
            }
        }
    }
    next();
};