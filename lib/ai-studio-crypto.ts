import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

function getEncryptionKey() {
  const secret = process.env.AI_SETTINGS_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Set AI_SETTINGS_ENCRYPTION_KEY (or NEXTAUTH_SECRET) before saving provider API keys.");
  }
  return scryptSync(secret, "studic-ai-studio-provider-keys", 32);
}

export function encryptAIProviderKey(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptAIProviderKey(value: string) {
  const [iv, authTag, encrypted] = value.split(".");
  if (!iv || !authTag || !encrypted) throw new Error("Stored provider key is unreadable. Please save it again.");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
