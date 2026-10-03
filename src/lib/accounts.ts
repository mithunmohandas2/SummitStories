import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const accountSchema = z
  .array(
    z.object({
      username: z.string().min(1).max(100),
      password: z.string().min(1).max(256),
      name: z.string().max(150).optional(),
    }),
  )
  .min(1);

export function configuredAccounts() {
  try {
    return accountSchema.parse(JSON.parse(process.env.BLOG_USERS ?? "[]"));
  } catch {
    return [];
  }
}

export function authenticateAccount(username: unknown, password: unknown) {
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 100 ||
    password.length > 256
  )
    return null;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  const suppliedPassword = digest(password);
  const account = configuredAccounts().find((candidate) => {
    const passwordMatches = timingSafeEqual(
      suppliedPassword,
      digest(candidate.password),
    );
    return candidate.username === username && passwordMatches;
  });
  return account
    ? { id: account.username, name: account.name || account.username }
    : null;
}

export function authConfigured() {
  return Boolean(process.env.NEXTAUTH_SECRET && configuredAccounts().length);
}
