import express from "express";
import cookieParser from "cookie-parser";
import routerV1 from "./routes";
import {handleError, notFound} from "./middlewares/error.middleware";

const app = express();

app.set("json replacer", (key: string, value: unknown) => key.endsWith("_public_id") ? undefined : value);
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", routerV1);

app.use(notFound);
app.use(handleError);

export default app;
