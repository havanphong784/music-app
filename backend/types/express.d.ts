import type {IPayload} from "../utils/jwt.utils.js";

declare global {
    namespace Express {
        interface Request {
            user: IPayload;
        }
    }
}

export {};
