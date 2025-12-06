// backend/src/api/routes/index.js
import { Router } from "express";

import rfpRouter from "./rfp.routes.js";

const router = Router();

const defaultRoutes = [
  { path: "/rfps", route: rfpRouter },
];

defaultRoutes.forEach((r) => {
  router.use(r.path, r.route);
});

export default router;
