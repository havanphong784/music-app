import mongoose from "mongoose";

export interface IComment {
    trackId: string;
    userId: string;
    content: string;
    parentId: string;
}

const commentSchema = new mongoose.Schema<IComment>({
    trackId: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: String,
        ref: "User",
        required: true,
        index: true,
    },
    content: {
        type: String,
        required: true,
    },
    parentId: String,
}, {timestamps: true});

commentSchema.index({trackId: 1, createdAt: -1});


const Comment = mongoose.model<IComment>("Comment", commentSchema, "comments");

export default Comment;
