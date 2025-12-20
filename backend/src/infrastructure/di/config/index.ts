import { Container } from '../Container';
import { configureDatabase } from './database.config';
import { configureStorage } from './storage.config';
import { configureAuth } from './auth.config';
import { configureFile } from './file.config';

export function configureContainer(): Container {
  const container = new Container();

  // Configure in order of dependencies
  configureDatabase(container);  // Database pool and repositories (base layer)
  configureStorage(container);   // Storage services
  configureAuth(container);       // Auth use cases and controller
  configureFile(container);       // File use cases and controller

  return container;
}

