import { Container } from '../Container';
import { OciStorageService } from '@infrastructure/oci/OciStorageService';

export function configureStorage(container: Container): void {
  // Storage Service - OCI Object Storage
  container.register<OciStorageService>('service.storage', () => {
    return new OciStorageService();
  });
}

