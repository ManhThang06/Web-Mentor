import express from "express";
import { Parser } from "json2csv";
import pool from "../db.js";

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        username,
        password,
        role,
        created_at
      FROM users
      ORDER BY id DESC
    `);

    const parser = new Parser({
      fields: [
        "id",
        "name",
        "username",
        "password",
        "role",
        "created_at",
      ],
    });

    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="users.csv"'
    );

    res.send(csv);
  } catch (error) {
    console.error("❌ CSV export failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to export users",
      error: error.message,
    });
  }
});

export default router;
