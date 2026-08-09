import {NextFunction, Request, Response} from "express";

export const notFound = (_req: Request, res: Response) => {
    return res.status(404).json({message: "Endpoint không tồn tại"});
};

export const handleError = (error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);

    const candidateStatus = typeof error === "object" && error !== null && "status" in error
        ? Number((error as {status?: unknown}).status)
        : 500;
    const status = Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus < 600
        ? candidateStatus
        : 500;
    if (status >= 500) console.error("Unhandled request error:", error);
    return res.status(status).json({message: status === 400 ? "JSON không hợp lệ" : "Lỗi hệ thống"});
};
