import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "@/models/User";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables.");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
    adminSeeded: false
  };
}

async function ensureDefaultAdmin() {
  if (cached.adminSeeded) return;

  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const name = process.env.DEFAULT_ADMIN_NAME || "Videa Admin";

  if (!email || !password) return;

  const normalizedEmail = email.toLowerCase().trim();
  let admin = await User.findOne({ email: normalizedEmail });

  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "admin"
    });
  } else if (admin.role !== "admin") {
    admin.role = "admin";
    await admin.save();
  }

  cached.adminSeeded = true;
}

export async function connectDB() {
  if (!cached.conn) {
    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, {
        bufferCommands: false
      });
    }

    cached.conn = await cached.promise;
  }

  await ensureDefaultAdmin();
  return cached.conn;
}