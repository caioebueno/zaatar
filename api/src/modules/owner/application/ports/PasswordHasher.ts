export interface PasswordHasher {
  hash(plainText: string): Promise<string>;
  verify(plainText: string, storedHash: string): Promise<boolean>;
}
