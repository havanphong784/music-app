import {Request, Response} from "express";
import User from "../../models/v1/user.model.js";

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.user.userId;
        const user = await User.findOne({_id: id, deleted: false}).select("-password");

        if (!user) {
            res.status(404).json({message: "Không tìm thấy user."});
            return;
        }

        res.status(200).json({
            message: "Lấy thông tin user thành công.",
            data: user
        });
    } catch {
        res.status(500).json({
            message: "Lỗi khi lấy thông tin user",
        });
    }
}
export const patchMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.user.userId;
        const updateData: {name?: string; avatar?: string} = {};

        if (typeof req.body.name === "string") {
            updateData.name = req.body.name.trim();
        }
        if (typeof req.body.avatarUrl === "string") {
            updateData.avatar = req.body.avatarUrl;
        }

        const user = await User.findOneAndUpdate(
            {_id: id, deleted: false},
            {$set: updateData},
            {new: true, runValidators: true}
        ).select("-password");

        if (!user) {
            res.status(404).json({message: "Không tìm thấy user."});
            return;
        }

        res.status(200).json({
            message: "Cập nhật thông tin user thành công.",
            data: user
        });
    } catch {
        res.status(500).json({message: "Lỗi khi cập nhật thông tin user"});
    }
}
