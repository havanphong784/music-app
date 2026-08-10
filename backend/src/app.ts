import express from "express";
import cookieParser from "cookie-parser";
import routerV1 from "./routes";
import {handleError, notFound} from "./middlewares/error.middleware";
import cors from 'cors';

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.set("json replacer", (key: string, value: unknown) => key.endsWith("_public_id") ? undefined : value);
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", routerV1);

app.use(notFound);
app.use(handleError);

export default app;
