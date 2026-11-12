/** Password hashing is a security concern, so the algorithm lives behind a port. */
export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(hash: string, password: string): Promise<boolean>
}
