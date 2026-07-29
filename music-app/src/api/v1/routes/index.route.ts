import {Express} from "express";

const prefixRoutes: string = "/api/v1"
const routesV1 = (app: Express): void => {
    app.get(prefixRoutes + "/auth");
}

export default routesV1;