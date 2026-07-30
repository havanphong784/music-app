import {NextFunction, Request, Response} from "express";

export const createTrackValidate = (req: Request, res: Response, next: NextFunction) => {
    const {title, genre} = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            message: "Tiêu đề bài hát không được để trống",
        })
    }

    if (!genre || !genre.trim()) {
        return res.status(400).json({
            message: "Thể loại bài hát không được để trống",
        })
    }

    if (!req.files || !('audio' in req.files)) {
        return res.status(400).json({
            message: "Vui lòng chọn file âm thanh (.mp3, .wav)",
        })
    }

    next();
}
