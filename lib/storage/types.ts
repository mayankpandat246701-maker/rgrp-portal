export interface PrivateStorageProvider {
  readonly name: string;
  save(storageKey: string, contents: Buffer): Promise<void>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

export class StorageUnavailableError extends Error {
  constructor() {
    super("Private storage is unavailable in this deployment.");
    this.name = "StorageUnavailableError";
  }
}
