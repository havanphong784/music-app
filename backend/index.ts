import express, {NextFunction, Request, Response} from 'express';
import 'dotenv/config.js'
import routerV1 from "./api/v1/routes/index.route";
import cookieParser from "cookie-parser";
import {connectRedis} from "./config/redis";

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());

await connectRedis();

app.use('/api/v1', routerV1);

app.use((_req: Request, res: Response) => {
    return res.status(404).json({message: "Endpoint không tồn tại"});
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled request error:", error);
    if (res.headersSent) return;
    return res.status(500).json({message: "Lỗi hệ thống"});
});

app.listen(port, () => {
    console.log(`Server đang chạy trên cổng ${port}`);
});
