type Constructor<T = unknown> = new (...args: unknown[]) => T;
type Factory<T = unknown> = () => T;
type Registration<T = unknown> = Constructor<T> | Factory<T> | T;

export class Container {
  private services = new Map<string, Registration>();
  private singletons = new Map<string, unknown>();

  register<T>(key: string, factory: Factory<T>): void {
    this.services.set(key, factory);
  }

  registerSingleton<T>(key: string, instance: T): void {
    this.singletons.set(key, instance);
  }

  resolve<T>(key: string): T {
    // Check if it's a singleton
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }

    // Get the registration
    const registration = this.services.get(key);
    if (!registration) {
      throw new Error(`Service not found: ${key}`);
    }

    // If it's already an instance, return it
    if (typeof registration !== 'function') {
      return registration as T;
    }

    // If it's a factory function, call it
    const factory = registration as Factory<T>;
    const instance = factory();

    return instance;
  }

  has(key: string): boolean {
    return this.services.has(key) || this.singletons.has(key);
  }
}
