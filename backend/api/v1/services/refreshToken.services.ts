import {createHash} from "node:crypto";
import redis from "../../../config/redis";

const time = 7 * 24 * 60 * 60;

export const hashToken = (token: string) => {
    return createHash("sha256").update(token).digest("hex");
};

export const getKey = (jti: string) => `auth:refresh-token:${jti}`;

export const saveRefreshToken = async (
    jti: string,
    refreshToken: string
) => {
    await redis.set(getKey(jti), hashToken(refreshToken), {
        EX: time
    });
};

export const consumeRefreshToken = async (
    jti: string,
    refreshToken: string
) => {
    const storedHash = await redis.getDel(getKey(jti));

    if (!storedHash) {
        return false;
    }

    return storedHash === hashToken(refreshToken);
};

export const revokeRefreshToken = async (jti: string) => {
    await redis.del(getKey(jti));
};
