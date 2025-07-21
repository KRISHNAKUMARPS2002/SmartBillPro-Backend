import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prismaClient.js";

export const register = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { userId } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique 4-digit client ID
    let clientId;
    let isUnique = false;

    while (!isUnique) {
      clientId = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit string
      const existingClient = await prisma.user.findFirst({
        where: { clientId },
      });
      if (!existingClient) isUnique = true;
    }

    const user = await prisma.user.create({
      data: {
        userId,
        password: hashedPassword,
        clientId,
      },
    });

    const token = jwt.sign(
      { userId: user.id, clientId: user.clientId },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { userId, password } = req.body;
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, clientId: user.clientId },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        userId: true,
        clientId: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
