import express from "express";
import 'dotenv/config'
import routesV1 from "./routes/v1/index.route.js";
import connectDb from "./config/database.config.js";
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;

await connectDb();

app.use((req, res, next) => {
    const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? "http://localhost:5173")
        .split(",")
        .map(origin => origin.trim());
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
    }
    next();
});

app.use(express.json());
app.use(cookieParser());

routesV1(app);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({message: "Lỗi máy chủ"});
});

app.listen(PORT, () => {
    console.log(`App đang chạy ở ${PORT}`);
})
