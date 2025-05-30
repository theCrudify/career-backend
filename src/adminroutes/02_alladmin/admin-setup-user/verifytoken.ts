import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "supersecurejwtsecret";

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Ambil token dari Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(403).json({ error: "Unauthorized: No token provided" });
            return;
        }

        const token = authHeader.split(" ")[1]; // Ambil token setelah "Bearer "
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded; // Simpan data user di req
        next();
    } catch (error) {
        res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
};
