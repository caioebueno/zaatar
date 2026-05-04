import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, saltHex, keyHex] = storedHash.split("$");

  if (algorithm !== "scrypt" || !saltHex || !keyHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedKey = Buffer.from(keyHex, "hex");
  const derivedKey = (await scrypt(password, salt, expectedKey.length)) as Buffer;

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedKey);
}
