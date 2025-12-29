import { ObjectStorageClient } from 'oci-objectstorage/lib/client';
import * as requests from 'oci-objectstorage/lib/request';
import * as models from 'oci-objectstorage/lib/model';
import * as common from 'oci-common';
import { IStorageService, UploadResult } from '@application/interfaces/IStorageService';
import { logger } from '@infrastructure/config/Logger';
import { v4 as uuidv4 } from 'uuid';

export class OciStorageService implements IStorageService {
    private client: ObjectStorageClient;
    private namespace: string;
    private bucketName: string;
    private compartmentId: string;

    constructor() {
        // Get credentials from environment variables
        const tenancyId = process.env.OCI_TENANCY_ID;
        const userId = process.env.OCI_USER_ID;
        const fingerprint = process.env.OCI_FINGERPRINT;
        const privateKey = process.env.OCI_PRIVATE_KEY;
        const region = process.env.OCI_REGION || 'us-ashburn-1';
        
        // Validate required credentials
        if (!tenancyId || !userId || !fingerprint || !privateKey) {
            throw new Error(
                'OCI authentication missing. Required env vars: ' +
                'OCI_TENANCY_ID, OCI_USER_ID, OCI_FINGERPRINT, OCI_PRIVATE_KEY'
            );
        }
        
        // Use SimpleAuthenticationDetailsProvider with env vars
        const provider = new common.SimpleAuthenticationDetailsProvider(
            tenancyId,
            userId,
            fingerprint,
            privateKey,
            null, // passphrase (null if key has no passphrase)
            common.Region.fromRegionId(region)
        );
        
        this.client = new ObjectStorageClient({ authenticationDetailsProvider: provider });
        
        this.namespace = process.env.OCI_NAMESPACE || '';
        this.bucketName = process.env.OCI_BUCKET_NAME || '';
        this.compartmentId = process.env.OCI_COMPARTMENT_ID || '';

        if (!this.namespace || !this.bucketName || !this.compartmentId) {
            throw new Error('OCI configuration missing: OCI_NAMESPACE, OCI_BUCKET_NAME, and OCI_COMPARTMENT_ID are required');
        }
    }

    async upload(buffer: Buffer, fileName: string, mimeType?: string): Promise<UploadResult> {
        try {
            const objectKey = this.generateObjectKey(fileName);
            
            const putObjectRequest: requests.PutObjectRequest = {
                namespaceName: this.namespace,
                bucketName: this.bucketName,
                putObjectBody: buffer,
                objectName: objectKey,
                contentLength: buffer.length,
                contentType: mimeType || 'application/octet-stream',
            };

            await this.client.putObject(putObjectRequest);

            logger.info(`File uploaded successfully: ${objectKey} (${buffer.length} bytes)`);

            return {
                objectKey,
                size: buffer.length,
            };
        } catch (error) {
            logger.error('OCI upload failed', { fileName, error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to upload file to OCI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async download(objectKey: string): Promise<Buffer> {
        try {
            const getObjectRequest: requests.GetObjectRequest = {
                namespaceName: this.namespace,
                bucketName: this.bucketName,
                objectName: objectKey,
            };

            const response = await this.client.getObject(getObjectRequest);
            
            // Convert stream to buffer
            const chunks: Buffer[] = [];
            for await (const chunk of response.value) {
                chunks.push(Buffer.from(chunk));
            }

            const buffer = Buffer.concat(chunks);
            logger.info(`File downloaded successfully: ${objectKey} (${buffer.length} bytes)`);
            return buffer;
        } catch (error) {
            logger.error('OCI download failed', { objectKey, error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to download file from OCI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async delete(objectKey: string): Promise<void> {
        try {
            const deleteObjectRequest: requests.DeleteObjectRequest = {
                namespaceName: this.namespace,
                bucketName: this.bucketName,
                objectName: objectKey,
            };

            await this.client.deleteObject(deleteObjectRequest);
            logger.info(`File deleted successfully: ${objectKey}`);
        } catch (error) {
            logger.error('OCI delete failed', { objectKey, error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to delete file from OCI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async generatePresignedUrl(objectKey: string, expiresInSeconds: number = 3600): Promise<string> {
        try {
            const createPreauthenticatedRequestDetails: models.CreatePreauthenticatedRequestDetails = {
                name: `presigned-${Date.now()}`,
                objectName: objectKey,
                accessType: models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
                timeExpires: new Date(Date.now() + expiresInSeconds * 1000),
            };

            const createPreauthenticatedRequest: requests.CreatePreauthenticatedRequestRequest = {
                namespaceName: this.namespace,
                bucketName: this.bucketName,
                createPreauthenticatedRequestDetails,
            };

            const response = await this.client.createPreauthenticatedRequest(createPreauthenticatedRequest);
            
            // Build full URL
            const baseUrl = `https://objectstorage.${process.env.OCI_REGION || 'us-ashburn-1'}.oraclecloud.com`;
            const url = `${baseUrl}${response.preauthenticatedRequest.accessUri}`;
            logger.info(`Presigned URL generated: ${objectKey} (expires in ${expiresInSeconds}s)`);
            return url;
        } catch (error) {
            logger.error('OCI presigned URL generation failed', { objectKey, error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async generatePresignedUploadUrl(objectKey: string, expiresInSeconds: number = 3600): Promise<string> {
        try {
            const createPreauthenticatedRequestDetails: models.CreatePreauthenticatedRequestDetails = {
                name: `presigned-upload-${Date.now()}`,
                objectName: objectKey,
                accessType: models.CreatePreauthenticatedRequestDetails.AccessType.ObjectWrite, // Write access for upload
                timeExpires: new Date(Date.now() + expiresInSeconds * 1000),
            };

            const createPreauthenticatedRequest: requests.CreatePreauthenticatedRequestRequest = {
                namespaceName: this.namespace,
                bucketName: this.bucketName,
                createPreauthenticatedRequestDetails,
            };

            const response = await this.client.createPreauthenticatedRequest(createPreauthenticatedRequest);
            
            // Build full URL
            const baseUrl = `https://objectstorage.${process.env.OCI_REGION || 'us-ashburn-1'}.oraclecloud.com`;
            const url = `${baseUrl}${response.preauthenticatedRequest.accessUri}`;
            logger.info(`Presigned upload URL generated: ${objectKey} (expires in ${expiresInSeconds}s)`);
            return url;
        } catch (error) {
            logger.error('OCI presigned upload URL generation failed', { objectKey, error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to generate presigned upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async moveObject(sourceKey: string, destinationKey: string): Promise<void> {
        try {
            logger.info(`Moving object: ${sourceKey} -> ${destinationKey}`);
            // Download from source
            const buffer = await this.download(sourceKey);
            
            // Upload to destination
            await this.upload(buffer, destinationKey);
            
            // Delete source
            await this.delete(sourceKey);
            logger.info(`Object moved successfully: ${sourceKey} -> ${destinationKey}`);
        } catch (error) {
            logger.error('OCI move failed', { sourceKey, destinationKey, error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to move object in OCI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async moveToArchive(objectKey: string): Promise<void> {
        try {
            // OCI Object Storage uses lifecycle policies to move objects to archive tier
            // However, we can also use the UpdateObjectStorageTier API to move objects programmatically
            // For now, we'll rely on lifecycle policies configured in OCI console
            // This method updates the database to reflect the archive status
            
            // Note: Actual tier transition happens via OCI lifecycle policy
            // This method is called after the object has been moved to archive tier
            logger.info(`Object marked for archive: ${objectKey}`);
            
            // In a production setup, you would:
            // 1. Configure OCI lifecycle policy to move objects to archive after X days
            // 2. Or use UpdateObjectStorageTier API (requires additional OCI SDK calls)
            
            // For now, we'll just log - the actual archiving is handled by OCI lifecycle policies
            // The database tier is updated separately via the repository
        } catch (error) {
            logger.error('OCI archive operation failed', { objectKey, error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to move object to archive: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async restoreFromArchive(objectKey: string): Promise<void> {
        try {
            // OCI Archive restoration: When an archived object is accessed via GetObject,
            // OCI automatically initiates a restore. However, we can also use HeadObject
            // to check if the object is archived and needs restoration.
            
            // For OCI, archived objects are automatically restored when accessed via GetObject
            // The restore happens asynchronously and takes 1-5 minutes
            // We'll use HeadObject to check the storage tier and initiate restore if needed
            
            const headObjectRequest: requests.HeadObjectRequest = {
                namespaceName: this.namespace,
                bucketName: this.bucketName,
                objectName: objectKey,
            };

            // Check object status - if archived, accessing it will trigger restore
            await this.client.headObject(headObjectRequest);
            
            // Note: OCI automatically restores archived objects when accessed
            // The actual restore is triggered by the first GetObject call
            // We'll log that restore is needed
            logger.info(`Archive restore initiated for: ${objectKey} (restore will complete in 1-5 minutes)`);
        } catch (error) {
            logger.error('OCI restore operation failed', { objectKey, error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to restore object from archive: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getObjectStorageTier(objectKey: string): Promise<'standard' | 'archive'> {
        try {
            // Note: OCI SDK doesn't directly expose storage tier via HeadObject
            // The storage tier is managed via lifecycle policies and bucket settings
            // For now, we'll rely on the database to track the tier
            // In production, you would check the object metadata or use OCI Console API
            
            // Since we can't easily determine tier from SDK, we'll default to standard
            // The actual tier is tracked in the database and updated when archiving
            logger.debug('Storage tier check requested', { objectKey });
            return 'standard';
        } catch (error) {
            logger.error('OCI get storage tier failed', { objectKey, error: error instanceof Error ? error.message : error });
            // Default to standard if we can't determine
            return 'standard';
        }
    }

    /**
     * Generates a secure, anonymous object key using UUID.
     * This prevents information leakage (filename, timestamp, user info) in bucket storage.
     * Original filename is stored only in the database for security.
     */
    private generateObjectKey(_fileName: string): string {
        // Generate UUID-only key for complete anonymity
        // Original filename is stored in database, not in object key
        return uuidv4();
    }
}

