import express from "express";
import { explainPassage, generatePostHooks } from "./aiController";

const aiRouter = express.Router();

// Routes
aiRouter.post("/explain", explainPassage);
aiRouter.post("/generate-hooks", generatePostHooks);

export default aiRouter;
