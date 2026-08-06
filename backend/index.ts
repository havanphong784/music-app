import express from 'express';
import 'dotenv/config.js'
import routerV1 from "./api/v1/routes/index.route";

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use('/api/v1', routerV1);

app.listen(port, () => {
    console.log(`Server đang chạy trên cổng ${port}`);
});