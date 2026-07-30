import {Express} from "express";
import authRoute from "./auth.route.js";
import tracksRoute from "./tracks.route.js";

const prefixRoutes: string = "/api/v1"
const routesV1 = (app: Express): void => {
    app.use(prefixRoutes + "/auth", authRoute);
    app.use(prefixRoutes + "/tracks", tracksRoute);
}

export default routesV1;