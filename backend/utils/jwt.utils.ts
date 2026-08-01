import jwt, {JwtPayload} from 'jsonwebtoken';
import {randomUUID} from 'node:crypto';

export interface IPayload {
    userId: string;
    email?: string;
    role?: string;
}

type TokenType = "access" | "refresh";

interface ITokenPayload extends IPayload, JwtPayload {
    tokenType: TokenType;
}

const getSecret = (tokenType: TokenType): string => {
    const secret = tokenType === "access"
        ? process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET
        : process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;

    if (!secret) {
        throw new Error(`Thiếu JWT_${tokenType.toUpperCase()}_SECRET hoặc JWT_SECRET`);
    }

    return secret;
}

export const generateRefreshToken = (payload: IPayload) => {
    return jwt.sign(
        {...payload, tokenType: "refresh"},
        getSecret("refresh"),
        {expiresIn: "7d", jwtid: randomUUID()}
    );
}

export const generateAcceptToken = (payload: IPayload) => {
    return jwt.sign(
        {...payload, tokenType: "access"},
        getSecret("access"),
        {expiresIn: "15m"}
    );
}

const verifyToken = (token: string, tokenType: TokenType): ITokenPayload | null => {
    try {
        const payload = jwt.verify(token, getSecret(tokenType));

        if (
            typeof payload === "string" ||
            payload.tokenType !== tokenType ||
            typeof payload.userId !== "string"
        ) {
            return null;
        }

        return payload as ITokenPayload;
    } catch {
        return null;
    }
}

export const verifyAccessToken = (token: string) => verifyToken(token, "access");

export const verifyRefreshToken = (token: string) => verifyToken(token, "refresh");
