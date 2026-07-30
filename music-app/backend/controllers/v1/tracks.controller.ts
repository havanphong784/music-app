import {Request, Response} from "express";
import Track, {ITrack} from "../../models/v1/tracks.model.js";

export const tracksPost = async (req: Request, res: Response) => {
    try {
        const {title, description, genre, audioUrl, avatarUrl, lyricsUrl, audioDuration} = req.body;
        const trackData = {
            title,
            description,
            genre,
            audioUrl,
            coverImageUrl: avatarUrl,
            lyricsUrl,
            duration: audioDuration,
            artist: (req as any).user?.userId
        };

        const track = new Track(trackData);
        await track.save();
        res.status(200).json({
            message: "Tạo bài hát thành công",
            data: track
        })
    } catch (err: any) {
        res.status(500).json({
            message: "Lỗi tạo bài hát",
            error: err.message
        })
    }
}

export const getTrackId = async (req: Request, res: Response) => {
    try {
        const id = req.params.trackId;
        const track = await Track.findById(id);

        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            })
            return;
        }
        res.status(200).json({
            message: "Lấy thông tin bài hát thành công.",
            data: track
        })
    } catch (err) {
        res.status(400).json({
            message: "Id bài hát không hợp lệ"
        })
    }
}

export const patchTrackId = async (req: Request, res: Response) => {
    try {
        const id = req.params.trackId;
        const track = await Track.findById(id);

        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const currentUserId = (req as any).user?.userId;
        if (track.artist.toString() !== currentUserId) {
            res.status(403).json({
                message: "Không có quyền chỉnh sửa bài hát này."
            });
            return;
        }

        const {title, description, genre, audioUrl, avatarUrl, lyricsUrl, audioDuration} = req.body;
        const updateData: Partial<ITrack> = {};

        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description;
        if (genre !== undefined) updateData.genre = genre.trim().toLowerCase();
        if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
        if (avatarUrl !== undefined) updateData.coverImageUrl = avatarUrl;
        if (lyricsUrl !== undefined) updateData.lyricsUrl = lyricsUrl;
        if (audioDuration !== undefined) updateData.duration = audioDuration;

        await Track.updateOne({_id: id}, updateData);

        res.status(200).json({
            message: "Cập nhật bài hát thành công."
        });
    } catch (err: any) {
        if (err.name === "CastError") {
            res.status(400).json({
                message: "Id bài hát không hợp lệ."
            });
            return;
        }
        res.status(500).json({
            message: "Lỗi cập nhật bài hát",
            error: err.message
        });
    }
};

export const deleteTrack = async (req: Request, res: Response) => {
    try {
        const id = req.params.trackId;
        const track = await Track.findById(id);
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const currentUserId = (req as any).user?.userId;
        if (track.artist.toString() !== currentUserId) {
            res.status(403).json({
                message: "Không có quyền xóa bài hát này."
            });
            return;
        }

        await Track.deleteOne({_id: id});
        res.status(200).json({
            message: "Xóa bài hát thành công."
        });
    } catch (err: any) {
        if (err.name === "CastError") {
            res.status(400).json({
                message: "Id bài hát không hợp lệ."
            });
            return;
        }
        res.status(500).json({
            message: "Lỗi xóa bài hát",
            error: err.message
        });
    }
};
