import { Router } from "express";
import {
  createNoteHandler,
  getNoteHandler,
  listNotesHandler,
  deleteNoteHandler,
} from "../controllers/goodsReceiptController";

const router = Router();

router.post("/goods-receipt-notes", createNoteHandler);
router.get("/goods-receipt-notes", listNotesHandler);
router.get("/goods-receipt-notes/:id", getNoteHandler);
router.delete("/goods-receipt-notes/:id", deleteNoteHandler);

export default router;
