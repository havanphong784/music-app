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
        name: String,
        email: String,
        password: String,
        role: String,
        deleted: {type: Boolean, default: false},
        createdAt: Date,
        deletedAt: Date
    }, {timestamps: true}
)

const User = mongoose.model<IUser>("User", userSchema,"users");
export default User;