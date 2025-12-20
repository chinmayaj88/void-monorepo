import { Container } from '../Container';
import { configureDatabase } from './database.config';
import { configureAuth } from './auth.config';

export function configureContainer(): Container {
  const container = new Container();

  // Configure in order of dependencies
  configureDatabase(container);  // Database pool and repositories (base layer)
  configureAuth(container);       // Auth use cases and controller

  return container;
}

