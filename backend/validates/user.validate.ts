import {NextFunction, Request, Response} from 'express'

export const patchMe = async (req: Request, res: Response, next: NextFunction) => {
    const {name} = req.body;
    const files = req.files as {[fieldname: string]: Express.Multer.File[]} | undefined;
    const avatar = files?.avatar?.[0];

    if (name === undefined && !avatar) {
        res.status(400).json({message: "Không có thông tin để cập nhật"});
        return;
    }

    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
        res.status(400).json({
            message: "Tên không hợp lệ",
        });
        return;
    }

    if (avatar && !avatar.mimetype.startsWith("image/")) {
        res.status(400).json({message: "Avatar phải là file ảnh"});
        return;
    }

    next();
}
