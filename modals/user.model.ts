import mongoose, { Schema, type Model } from "mongoose";

export type UserRole = "student" | "seller" | "admin";
export type UserStatus = "active" | "suspended" | "deleted";

export function getId() {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let value = Date.now() - 1707805802621 + Math.floor(Math.random() * 100);
  let result = "";
  do {
    result = alphabet[value % alphabet.length] + result;
    value = Math.floor(value / alphabet.length);
  } while (value > 0);
  return result;
}

export interface IUser {
  _id?: string;
  username?: string;
  name: string;
  email: string;
  password?: string;
  about?: string;
  phone?: string | number;
  image?: string;
  role?: UserRole;
  status?: UserStatus;
  account?: string;
  ifsc?: string;
  emailVerified?: Date | null;
  lastLoginAt?: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

const SellerProfileSchema = new Schema(
  {
    account: { type: String, trim: true },
    ifsc: { type: String, trim: true, uppercase: true },
    payoutEnabled: { type: Boolean, default: false },
  },
  { _id: false }
);

export const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      default: getId,
      minlength: 2,
      maxlength: 30,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, select: false },
    about: { type: String, trim: true, maxlength: 500 },
    phone: { type: String, trim: true, maxlength: 20 },
    image: { type: String, default: "" },
    role: { type: String, enum: ["student", "seller", "admin"], default: "student", index: true },
    status: { type: String, enum: ["active", "suspended", "deleted"], default: "active", index: true },
    account: { type: String, trim: true, select: false },
    ifsc: { type: String, trim: true, uppercase: true, select: false },
    emailVerified: { type: Date, default: null },
    lastLoginAt: { type: Date },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

UserSchema.index({ role: 1, status: 1, createdOn: -1 });

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
