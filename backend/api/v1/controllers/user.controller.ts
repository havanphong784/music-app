import prisma from "../../../config/db";
import {Response} from "express";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({message: "Chưa xác thực"});
        }

        const user = await prisma.users.findUnique({
            where: {id: userId}
        });

        if (!user) {
            return res.status(404).json({message: "Người dùng không tồn tại"});
        }

        const {password_hash: _passwordHash, ...safeUser} = user;
        return res.status(200).json({user: safeUser});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const updateMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({message: "Chưa xác thực"});
        }

        const {display_name, avatar_url} = req.body;
        const updateData: {display_name?: string; avatar_url?: string | null} = {};

        if (display_name !== undefined) {
            updateData.display_name = display_name.trim();
        }
        if (avatar_url !== undefined) {
            updateData.avatar_url = avatar_url;
        }

        const updatedUser = await prisma.users.update({
            where: {id: userId},
            data: updateData
        });

        const {password_hash: _passwordHash, ...safeUser} = updatedUser;
        return res.status(200).json({message: "Cập nhật hồ sơ thành công", user: safeUser});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const user = await prisma.users.findUnique({
            where: {id},
            select: {
                id: true,
                display_name: true,
                avatar_url: true,
                created_at: true
            }
        });

        if (!user) {
            return res.status(404).json({message: "Người dùng không tồn tại"});
        }

        return res.status(200).json({user});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
        const q = (req.query.q as string)?.trim();

        const whereCondition = q
            ? {
                OR: [
                    {email: {contains: q, mode: "insensitive" as const}},
                    {display_name: {contains: q, mode: "insensitive" as const}}
                ]
            }
            : {};

        const total = await prisma.users.count({where: whereCondition});
        const users = await prisma.users.findMany({
            where: whereCondition,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {created_at: "desc"},
            select: {
                id: true,
                email: true,
                display_name: true,
                avatar_url: true,
                role: true,
                created_at: true
            }
        });

        return res.status(200).json({
            users,
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

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const {role} = req.body;

        const existUser = await prisma.users.findUnique({where: {id}});
        if (!existUser) {
            return res.status(404).json({message: "Người dùng không tồn tại"});
        }

        const updatedUser = await prisma.users.update({
            where: {id},
            data: {role}
        });

        const {password_hash: _passwordHash, ...safeUser} = updatedUser;
        return res.status(200).json({message: "Cập nhật vai trò người dùng thành công", user: safeUser});
    } catch (error) {
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};
