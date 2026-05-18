import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { PasswordHasher } from "../../application/ports/PasswordHasher.js";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plainText: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = (await scrypt(plainText, salt, KEY_LENGTH)) as Buffer;

    return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
  }

  async verify(plainText: string, storedHash: string): Promise<boolean> {
    const [algorithm, saltHex, keyHex] = storedHash.split("$");

    if (algorithm !== "scrypt" || !saltHex || !keyHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");
    const derivedKey = (await scrypt(plainText, salt, expectedKey.length)) as Buffer;

    if (derivedKey.length !== expectedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedKey);
  }
}
