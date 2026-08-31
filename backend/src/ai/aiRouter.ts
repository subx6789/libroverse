import express from "express";
import { explainPassage } from "./aiController";

const aiRouter = express.Router();

// Route: POST /api/ai/explain
aiRouter.post("/explain", explainPassage);

export default aiRouter;
