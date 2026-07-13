import path from 'node:path';
import { pathToFileURL } from 'node:url';

export interface HotSwapModule {
  name: string;
  implementation: string;
  checksum: string;
  modulePath?: string;
}

export class HotSwapMonitor {
  private readonly modules = new Map<string, HotSwapModule>();

  register(name: string, implementation: string): HotSwapModule {
    const checksum = `${name}:${implementation.length}`;
    const module: HotSwapModule = { name, implementation, checksum };
    this.modules.set(name, module);
    return module;
  }

  async registerFromFile(name: string, modulePath: string): Promise<HotSwapModule> {
    const absolutePath = path.resolve(process.cwd(), modulePath);
    const imported = await import(pathToFileURL(absolutePath).href);
    const implementation = Object.keys(imported).join(',');
    const checksum = `${name}:${absolutePath}:${implementation.length}`;
    const module: HotSwapModule = {
      name,
      implementation,
      checksum,
      modulePath: absolutePath,
    };
    this.modules.set(name, module);
    return module;
  }

  async load(name: string): Promise<Record<string, unknown>> {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Hot-swap module ${name} is not registered.`);
    }

    if (!module.modulePath) {
      return { __module__: module.implementation };
    }

    const imported = await import(pathToFileURL(module.modulePath).href);
    return imported as Record<string, unknown>;
  }

  snapshot(): HotSwapModule[] {
    return Array.from(this.modules.values());
  }
}
