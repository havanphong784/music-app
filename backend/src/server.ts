import "dotenv/config.js";
import app from "./app";
import {connectRedis} from "./config/redis";

await connectRedis();

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
    console.log(`Server đang chạy trên cổng ${port}`);
});
