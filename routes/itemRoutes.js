// routes/itemRoutes.js
import express from "express";
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../utils/upload.js";

const router = express.Router();

router.use(authenticate);

router.post("/", upload.single("image"), createItem);
router.get("/", getItems);
router.get("/:id", getItemById);
router.put("/:id", upload.single("image"), updateItem);
router.delete("/:id", deleteItem);

export default router;
