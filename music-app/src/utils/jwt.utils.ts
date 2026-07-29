import jwt, {JwtPayload} from 'jsonwebtoken';

interface IPayload {
    userId: string;
    email?: string;
    role?: string;
}

export const generateToken = (payload: IPayload) => {
    return jwt.sign(payload, process.env.JWT_SECRET as string, {expiresIn: '7d'});
}

export const verifyToken = (token: string): JwtPayload | null | string => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
        return null;
    }
}