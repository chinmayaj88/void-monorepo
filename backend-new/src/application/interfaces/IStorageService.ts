export interface UploadResult {
    objectKey: string;
    size: number;
}

export interface IStorageService {
    upload(buffer: Buffer, fileName: string, mimeType?: string): Promise<UploadResult>;
    download(objectKey: string): Promise<Buffer>;
    delete(objectKey: string): Promise<void>;
    generatePresignedUrl(objectKey: string, expiresInSeconds?: number): Promise<string>;
    generatePresignedUploadUrl(objectKey: string, expiresInSeconds?: number): Promise<string>;
    // Archive operations
    moveToArchive(objectKey: string): Promise<void>;
    restoreFromArchive(objectKey: string): Promise<void>;
    getObjectStorageTier(objectKey: string): Promise<'standard' | 'archive'>;
}

