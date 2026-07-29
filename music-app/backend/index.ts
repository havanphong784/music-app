import express from "express";
import 'dotenv/config'
import routesV1 from "./routes/v1/index.route.js";
import connectDb from "./config/database.config.js";
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;

await connectDb();

app.use(express.json());
app.use(cookieParser());

routesV1(app);

app.listen(PORT, () => {
    console.log(`App đang chạy ở ${PORT}`);
})
