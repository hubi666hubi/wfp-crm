/* eslint-disable @typescript-eslint/no-require-imports */
import { spawn } from "child_process";

interface JobPayload {
    patch: any;
    report: any;
    backup_dir?: string;
}

class InMemoryFallbackQueue<T> {
    private queue: T[] = [];
    public async enqueue(item: T): Promise<string> {
        this.queue.push(item);
        return `mem_job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    public process(concurrency: number, handler: (item: T) => Promise<void>): void {
        const worker = async () => {
            while (this.queue.length > 0) {
                const batch = this.queue.splice(0, concurrency);
                await Promise.all(batch.map(handler));
            }
        };
        setInterval(worker, 1000);
    }
}

export class ResilientTaskRouter {
    private redisAvailable: boolean = false;
    private memoryQueue: InMemoryFallbackQueue<any>;
    private pythonEnginePath: string = "sandbox_l4_harden.py";

    constructor() {
        this.memoryQueue = new InMemoryFallbackQueue<any>();
        this.checkRedisAndInitialize();
    }

    private async checkRedisAndInitialize(): Promise<void> {
        try {
            const { default: Redis } = await import("ioredis");
            const client = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
                lazyConnect: true,
                enableOfflineQueue: false,
                connectTimeout: 1000,
                maxRetriesPerRequest: 0
            });
            await client.connect();
            await client.quit();
            this.redisAvailable = true;
            console.log("[BABILON NOMINAL] Redis infrastructure integrated successfully.");
        } catch (err) {
            this.redisAvailable = false;
            console.warn("[BABILON SUPPRESSION] Redis disconnected. Core routing switched to local in-memory matrix.");
        }
    }

    public async routeTask(taskName: string, data: JobPayload): Promise<string> {
        if (!this.redisAvailable) {
            return await this.memoryQueue.enqueue({ taskName, data });
        }
        return `bull_job_${Date.now()}`;
    }

    public executePythonValidationBridge(patchPayload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let pythonCmd = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');
            const path = require('path');
            const venvPythonPath = process.platform === 'win32'
                ? path.resolve(process.cwd(), '.venv', 'Scripts', 'python.exe')
                : path.resolve(process.cwd(), '.venv', 'bin', 'python');
            if (!process.env.PYTHON_CMD && fs.existsSync(venvPythonPath)) {
                pythonCmd = venvPythonPath;
            }
            // Check script exists before spawning
            const fs = require('fs');
            if (!fs.existsSync(this.pythonEnginePath)) {
                console.warn('[PYTHON BRIDGE] Script not found, skipping:', this.pythonEnginePath);
                return resolve({ is_valid: false, errors: ['Python bridge script not found on server'] });
            }
            const pyProcess = spawn(pythonCmd, [this.pythonEnginePath]);
            let outputData = "";
            // CRITICAL: handle ENOENT/spawn errors without crashing the server
            pyProcess.on('error', (err) => {
                console.error(`[PYTHON BRIDGE] Spawn failed: ${err.message}`);
                resolve({ is_valid: false, errors: [`Python bridge spawn failed: ${err.message}`] });
            });
            pyProcess.stdout.on("data", (data) => { outputData += data.toString(); });
            pyProcess.stderr.on("data", (data) => { console.error(`[PYTHON BRIDGE ERROR]: ${data}`); });
            pyProcess.on("close", () => {
                try {
                    resolve(JSON.parse(outputData));
                } catch {
                    resolve({ is_valid: false, errors: ["Failed to compile structural JSON output over bridge."] });
                }
            });
            pyProcess.stdin.write(JSON.stringify(patchPayload));
            pyProcess.stdin.end();
        });
    }
}
