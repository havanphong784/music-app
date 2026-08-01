import * as mongoose from "mongoose";

export interface IUser {
    name: string,
    email: string,
    password: string,
    role: string,
    deleted: boolean,
    createdAt: Date,
    deletedAt: Date
}

const userSchema = new mongoose.Schema<IUser>({
        name: {type: String, required: true, trim: true},
        email: {type: String, required: true, unique: true, lowercase: true, trim: true},
        password: {type: String, required: true, select: false},
        role: {type: String, default: "user"},
        deleted: {type: Boolean, default: false},
        createdAt: Date,
        deletedAt: Date
    }, {timestamps: true}
)

const User = mongoose.model<IUser>("User", userSchema,"users");
export default User;
