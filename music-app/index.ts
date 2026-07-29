import express from "express";
import 'dotenv/config'
import routesV1 from "./src/api/v1/routes/index.route.js";

const app = express();
const PORT = process.env.PORT || 3000;

routesV1(app);

app.listen(PORT, () => {
    console.log(`App đang chạy ở ${PORT}`);
})
