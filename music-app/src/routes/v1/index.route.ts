import {Express} from "express";
import authRoute from "./auth.route.js";

const prefixRoutes: string = "/api/v1"
const routesV1 = (app: Express): void => {
    app.use(prefixRoutes + "/auth", authRoute);
}

export default routesV1;