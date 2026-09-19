import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function getSecretKey() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required for production security");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

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
    .sign(getSecretKey());
}

export async function verifyJwt(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as UserSessionPayload;
  } catch (error) {
    return null;
  }
}
