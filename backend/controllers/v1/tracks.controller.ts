import {Request, Response} from "express";
import Track, {ITrack} from "../../models/v1/tracks.model.js";
import Comment from "../../models/v1/comment.model.js";
import cloudinaryConfig from "../../config/cloudinary.config.js";
import {Like} from "../../models/v1/like.model.js";

export const tracksGet = async (req: Request, res: Response): Promise<void> => {
    try {
        const {sortKey, sortValue, keyword, genre, page, limit} = req.query;

        const find: Record<string, any> = {};

        if (keyword && typeof keyword === "string" && keyword.trim() !== "") {
            find.title = new RegExp(keyword, "i");
        }

        if (genre && typeof genre === "string" && genre.trim() !== "") {
            find.genre = genre.trim().toLowerCase();
        }

        const sort: Record<string, 1 | -1> = {};
        if (sortKey && typeof sortKey === "string") {
            const isAsc = sortValue === "asc" || sortValue === "1";
            sort[sortKey] = isAsc ? 1 : -1;
        } else {
            sort.createdAt = -1;
        }

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
        const skip = (pageNum - 1) * limitNum;

        const totalCount = await Track.countDocuments(find);
        const totalPages = Math.ceil(totalCount / limitNum);

        const tracks = await Track.find(find)
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: "Lấy danh sách bài hát thành công.",
            data: tracks,
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalCount,
                totalPages
            }
        });
    } catch (err: any) {
        res.status(500).json({
            message: "Lỗi lấy danh sách bài hát",
            error: err.message
        });
    }
};

export const tracksPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            title,
            description,
            genre,
            audioUrl,
            audioPublicId,
            avatarUrl,
            avatarPublicId,
            lyricsUrl,
            lyricsPublicId,
            audioDuration
        } = req.body ?? {};
        const trackData = {
            title,
            description,
            genre,
            audioUrl,
            audioPublicId,
            coverImageUrl: avatarUrl,
            coverImagePublicId: avatarPublicId,
            lyricsUrl,
            lyricsPublicId,
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

export const getTrackId = async (req: Request, res: Response): Promise<void> => {
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

export const patchTrackId = async (req: Request, res: Response): Promise<void> => {
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

        const {
            title,
            description,
            genre,
            audioUrl,
            audioPublicId,
            avatarUrl,
            avatarPublicId,
            lyricsUrl,
            lyricsPublicId,
            audioDuration
        } = req.body ?? {};
        const updateData: Partial<ITrack> = {};

        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description;
        if (genre !== undefined) updateData.genre = genre.trim().toLowerCase();
        if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
        if (audioPublicId !== undefined) updateData.audioPublicId = audioPublicId;
        if (avatarUrl !== undefined) updateData.coverImageUrl = avatarUrl;
        if (avatarPublicId !== undefined) updateData.coverImagePublicId = avatarPublicId;
        if (lyricsUrl !== undefined) updateData.lyricsUrl = lyricsUrl;
        if (lyricsPublicId !== undefined) updateData.lyricsPublicId = lyricsPublicId;
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

export const deleteTrack = async (req: Request, res: Response): Promise<void> => {
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
        await Like.deleteMany({trackId: id});
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

export const getTrackStream = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.trackId;
        const track = await Track.findById(id);
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        if (!track.audioPublicId) {
            res.status(400).json({
                message: "Bài hát chưa có ID âm thanh trên cloud (audioPublicId)."
            });
            return;
        }

        const expiresAt = Math.floor(Date.now() / 1000) + 60 * 5; // 5 phút
        const streamUrl = cloudinaryConfig.utils.private_download_url(track.audioPublicId, '', {
            resource_type: 'video',
            type: 'authenticated',
            expires_at: expiresAt
        });

        res.status(200).json({
            message: "Lấy stream track thành công.",
            streamUrl,
            expiresAt
        });
    } catch (err: any) {
        if (err.name === "CastError") {
            res.status(400).json({
                message: "Id bài hát không hợp lệ."
            });
            return;
        }
        res.status(500).json({
            message: "Lỗi khi lấy stream.",
            error: err.message
        });
    }
};

export const postTrackPlay = async (req: Request, res: Response): Promise<void> => {
    try {
        const track = await Track.findByIdAndUpdate(req.params.trackId, {$inc: {playCount: 1}}, {
            returnDocument: "after",
            runValidators: true
        }).select("_id playCount");
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }
        res.status(200).json({
            message: "Ghi nhận lượt nghe thành công.",
            data: {
                trackId: track._id,
                playCount: track.playCount
            }
        });
    } catch (err: any) {
        if (err.name === "CastError") {
            res.status(400).json({
                message: "Id bài hát không hợp lệ."
            });
            return;
        }
        res.status(500).json({
            message: "Lỗi ghi nhận lượt nghe.",
            error: err.message
        });
    }
};

export const postTrackComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const {content, parentId} = req.body ?? {};
        if (!content || content.trim() === "") {
            res.status(400).json({
                message: "Bình luận không được để trống"
            });
            return;
        }
        const id = req.params.trackId;
        const track = await Track.findById(id);
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({
                message: "Bạn chưa đăng nhập."
            });
            return;
        }

        const comment = new Comment({
            userId: userId,
            parentId: parentId,
            trackId: id,
            content: content.trim()
        });

        await comment.save();

        res.status(201).json({
            message: "Gửi bình luận thành công.",
            data: comment
        });
    } catch (err: any) {
        if (err.name === "CastError") {
            res.status(400).json({
                message: "Id bài hát không hợp lệ."
            });
            return;
        }
        res.status(500).json({
            message: "Lỗi gửi comment",
            error: err.message
        });
    }
};

export const getTrackComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.trackId;
        const track = await Track.findById(id);
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }
        const comments = await Comment.find({trackId: id}).sort({createdAt: -1});
        res.status(200).json({
            message: "Lấy danh sách bình luận thành công.",
            data: comments
        });
    } catch (err: any) {
        if (err.name === "CastError") {
            res.status(400).json({
                message: "Id bài hát không hợp lệ."
            });
            return;
        }
        res.status(500).json({
            message: "Lỗi lấy danh sách bình luận.",
            error: err.message
        });
    }
};

export const postTrackLike = async (req: Request, res: Response): Promise<void> => {
    try {
        const trackId = req.params.trackId;
        const userId = req.user.userId;

        const trackStore = await Track.findById(trackId);
        if (!trackStore) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const like = await Like.findOne({
            userId: userId,
            trackId: trackId
        });

        if (like) {
            res.status(200).json({
                message: "Bạn đã like bài hát này rồi."
            });
            return;
        }

        const newLike = new Like({userId, trackId});
        await newLike.save();

        await Track.findByIdAndUpdate(trackId, {$inc: {likeCount: 1}});

        res.status(200).json({
            message: "Like bài hát thành công.",
            data: newLike,
        });
    } catch (err: any) {
        if (err.name === "CastError") {
            res.status(400).json({
                message: "Id bài hát không hợp lệ."
            });
            return;
        }
        res.status(500).json({
            message: "Lỗi khi like bài hát.",
            error: err.message
        });
    }
};


export const deleteTrackLike = async (req: Request, res: Response): Promise<void> => {
    try {
        const trackId = req.params.trackId;
        const userId = req.user.userId;

        if (!userId) {
            res.status(401).json({
                message: "Bạn chưa đăng nhập."
            });
            return;
        }

        const trackStored = await Track.findById(trackId);
        if (!trackStored) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const like = await Like.findOne({trackId: trackId, userId: userId});
        if (!like) {
            res.status(400).json({
                message: "Bạn chưa like bài hát này."
            });
            return;
        }

        await Like.findByIdAndDelete(like._id);
        const updatedLikeCount = Math.max(0, trackStored.likeCount - 1);
        await Track.findByIdAndUpdate(trackId, {likeCount: updatedLikeCount});

        res.status(200).json({
            message: "Đã hủy like thành công."
        });
    } catch (e: any) {
        if (e.name === "CastError") {
            res.status(400).json({
                message: "Id bài hát không hợp lệ."
            });
            return;
        }
        res.status(500).json({
            message: "Lỗi khi hủy like.",
            error: e.message
        });
    }
};
