import { Container } from '../Container';
import { FileRepository } from '@infrastructure/database/repositories/FileRepository';
import { PermissionRepository } from '@infrastructure/database/repositories/PermissionRepository';
import { UserRepository } from '@infrastructure/database/repositories/UserRepository';
import { OciStorageService } from '@infrastructure/oci/OciStorageService';
import { UploadFileUseCase } from '@application/use-cases/files/UploadFileUseCase';
import { DownloadFileUseCase } from '@application/use-cases/files/DownloadFileUseCase';
import { ListFilesUseCase } from '@application/use-cases/files/ListFilesUseCase';
import { CreateFolderUseCase } from '@application/use-cases/files/CreateFolderUseCase';
import { MoveFileUseCase } from '@application/use-cases/files/MoveFileUseCase';
import { SetFileAccessUseCase } from '@application/use-cases/files/SetFileAccessUseCase';
import { ShareFileUseCase } from '@application/use-cases/files/ShareFileUseCase';
import { UpdatePermissionUseCase } from '@application/use-cases/files/UpdatePermissionUseCase';
import { GetFilePermissionsUseCase } from '@application/use-cases/files/GetFilePermissionsUseCase';
import { RevokePermissionUseCase } from '@application/use-cases/files/RevokePermissionUseCase';
import { RequestUploadUrlUseCase } from '@application/use-cases/files/RequestUploadUrlUseCase';
import { ConfirmUploadUseCase } from '@application/use-cases/files/ConfirmUploadUseCase';
import { MoveToArchiveUseCase } from '@application/use-cases/files/MoveToArchiveUseCase';
import { RestoreFromArchiveUseCase } from '@application/use-cases/files/RestoreFromArchiveUseCase';
import { GetStorageStatsUseCase } from '@application/use-cases/files/GetStorageStatsUseCase';
import { FileController } from '@presentation/http/controllers/FileController';

export function configureFile(container: Container): void {
  // File Use Cases
  container.register<UploadFileUseCase>('usecase.uploadFile', () => {
    return new UploadFileUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<OciStorageService>('service.storage')
    );
  });

  container.register<DownloadFileUseCase>('usecase.downloadFile', () => {
    return new DownloadFileUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<PermissionRepository>('repository.permission'),
      container.resolve<OciStorageService>('service.storage'),
      container.resolve<UserRepository>('repository.user')
    );
  });

  container.register<ListFilesUseCase>('usecase.listFiles', () => {
    return new ListFilesUseCase(
      container.resolve<FileRepository>('repository.file')
    );
  });

  container.register<CreateFolderUseCase>('usecase.createFolder', () => {
    return new CreateFolderUseCase(
      container.resolve<FileRepository>('repository.file')
    );
  });

  container.register<MoveFileUseCase>('usecase.moveFile', () => {
    return new MoveFileUseCase(
      container.resolve<FileRepository>('repository.file')
    );
  });

  container.register<SetFileAccessUseCase>('usecase.setFileAccess', () => {
    return new SetFileAccessUseCase(
      container.resolve<FileRepository>('repository.file')
    );
  });

  container.register<ShareFileUseCase>('usecase.shareFile', () => {
    return new ShareFileUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<PermissionRepository>('repository.permission'),
      container.resolve<UserRepository>('repository.user')
    );
  });

  container.register<UpdatePermissionUseCase>('usecase.updatePermission', () => {
    return new UpdatePermissionUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<PermissionRepository>('repository.permission'),
      container.resolve<UserRepository>('repository.user')
    );
  });

  container.register<GetFilePermissionsUseCase>('usecase.getFilePermissions', () => {
    return new GetFilePermissionsUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<PermissionRepository>('repository.permission')
    );
  });

  container.register<RevokePermissionUseCase>('usecase.revokePermission', () => {
    return new RevokePermissionUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<PermissionRepository>('repository.permission'),
      container.resolve<UserRepository>('repository.user')
    );
  });

  container.register<RequestUploadUrlUseCase>('usecase.requestUploadUrl', () => {
    return new RequestUploadUrlUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<OciStorageService>('service.storage')
    );
  });

  container.register<ConfirmUploadUseCase>('usecase.confirmUpload', () => {
    return new ConfirmUploadUseCase(
      container.resolve<FileRepository>('repository.file')
    );
  });

  container.register<MoveToArchiveUseCase>('usecase.moveToArchive', () => {
    return new MoveToArchiveUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<OciStorageService>('service.storage')
    );
  });

  container.register<RestoreFromArchiveUseCase>('usecase.restoreFromArchive', () => {
    return new RestoreFromArchiveUseCase(
      container.resolve<FileRepository>('repository.file'),
      container.resolve<OciStorageService>('service.storage')
    );
  });

  container.register<GetStorageStatsUseCase>('usecase.getStorageStats', () => {
    return new GetStorageStatsUseCase(
      container.resolve<FileRepository>('repository.file')
    );
  });

  // File Controller
  container.register<FileController>('controller.file', () => {
    return new FileController(
      container.resolve<UploadFileUseCase>('usecase.uploadFile'),
      container.resolve<DownloadFileUseCase>('usecase.downloadFile'),
      container.resolve<ListFilesUseCase>('usecase.listFiles'),
      container.resolve<CreateFolderUseCase>('usecase.createFolder'),
      container.resolve<MoveFileUseCase>('usecase.moveFile'),
      container.resolve<SetFileAccessUseCase>('usecase.setFileAccess'),
      container.resolve<ShareFileUseCase>('usecase.shareFile'),
      container.resolve<UpdatePermissionUseCase>('usecase.updatePermission'),
      container.resolve<GetFilePermissionsUseCase>('usecase.getFilePermissions'),
      container.resolve<RevokePermissionUseCase>('usecase.revokePermission'),
      container.resolve<RequestUploadUrlUseCase>('usecase.requestUploadUrl'),
      container.resolve<ConfirmUploadUseCase>('usecase.confirmUpload'),
      container.resolve<MoveToArchiveUseCase>('usecase.moveToArchive'),
      container.resolve<RestoreFromArchiveUseCase>('usecase.restoreFromArchive'),
      container.resolve<GetStorageStatsUseCase>('usecase.getStorageStats')
    );
  });
}

