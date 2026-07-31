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
    },
    userId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    parentId: String,
}, {timestamps: true});


const Comment = mongoose.model<IComment>("Comment", commentSchema, "comments");

export default Comment;