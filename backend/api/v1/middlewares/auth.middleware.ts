import {NextFunction, Request, Response} from "express";
import {IPayload, verifyAccessToken} from "../utils/jwt.utils";

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