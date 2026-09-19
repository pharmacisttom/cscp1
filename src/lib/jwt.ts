import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_key_12345";
const key = new TextEncoder().encode(JWT_SECRET);

export interface UserSessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  district: string;
}

export async function signJwt(payload: Omit<UserSessionPayload, "exp" | "iat">) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verifyJwt(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as UserSessionPayload;
  } catch (error) {
    return null;
  }
}
