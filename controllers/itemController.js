// controllers/itemController.js
import fs from "fs";
import path from "path";
import prisma from "../utils/prismaClient.js";

// ➕ Create Item
export const createItem = async (req, res) => {
  try {
    const { name, description, price, inStock = true } = req.body;
    const clientId = req.user.clientId;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await prisma.item.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        inStock: inStock === "true",
        clientId,
      },
    });

    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create item" });
  }
};

// 📦 Get All Items (for the logged-in client)
export const getItems = async (req, res) => {
  try {
    const clientId = req.user.clientId;

    const items = await prisma.item.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch items" });
  }
};

// 🔍 Get Single Item
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;

    const item = await prisma.item.findFirst({
      where: {
        id,
        clientId,
      },
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch item" });
  }
};

// ✏️ Update Item
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;
    const { name, description, price, inStock } = req.body;

    const existingItem = await prisma.item.findFirst({
      where: { id, clientId },
    });

    if (!existingItem)
      return res.status(404).json({ message: "Item not found" });

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : existingItem.imageUrl;

    console.log("Uploaded file:", req.file);

    const item = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        inStock: inStock === "true",
      },
    });

    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update item" });
  }
};

// ❌ Delete Item
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;

    const existingItem = await prisma.item.findFirst({
      where: { id, clientId },
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // 🧹 Delete image from disk if exists
    if (existingItem.imageUrl) {
      const imagePath = path.join(
        process.cwd(),
        existingItem.imageUrl.replace(/^\/+/, "")
      );
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.warn(
            "⚠️ Image file not found or already deleted:",
            err.message
          );
        } else {
          console.log("🗑️ Image deleted from storage:", imagePath);
        }
      });
    }

    await prisma.item.delete({ where: { id } });

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete item" });
  }
};
