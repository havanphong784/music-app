import express from 'express';
import 'dotenv/config.js'
import routerV1 from "./api/v1/routes/index.route";
import cookieParser from "cookie-parser";
import {connectRedis} from "./config/redis";
import {handleError, notFound} from "./api/v1/middlewares/error.middleware";

const app = express();
const port = process.env.PORT;

app.set("json replacer", (key: string, value: unknown) => key.endsWith("_public_id") ? undefined : value);
app.use(express.json());
app.use(cookieParser());

await connectRedis();

app.use('/api/v1', routerV1);

app.use(notFound);
app.use(handleError);

app.listen(port, () => {
    console.log(`Server đang chạy trên cổng ${port}`);
});
