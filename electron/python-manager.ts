import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import fs from 'node:fs';

const DEFAULT_PORT = Number(process.env.BACKEND_PORT || 5175);

export class PythonManager {
  private process: ChildProcessWithoutNullStreams | null = null;
  private port: number;

  constructor(port = DEFAULT_PORT) {
    this.port = port;
  }

  /**
   * Resuelve el intérprete de Python a utilizar:
   * 1) Respeta `PYTHON_PATH` si está definido
   * 2) Prefiere `.venv` local del proyecto si existe
   * 3) Fallback al binario del sistema por plataforma
   *
   * @returns Ruta o nombre del ejecutable de Python
   */
  private getPythonCmd(): string {
    if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;

    const projectRoot = process.cwd();
    if (process.platform === 'win32') {
      const venvWin = path.join(projectRoot, '.venv', 'Scripts', 'python.exe');
      if (fs.existsSync(venvWin)) return venvWin;
      return 'python';
    }

    const venvUnix = path.join(projectRoot, '.venv', 'bin', 'python');
    if (fs.existsSync(venvUnix)) return venvUnix;
    return 'python3';
  }

  async start(): Promise<void> {
    if (this.process) return;
    const python = this.getPythonCmd();
    const backendDir = path.join(process.cwd(), 'backend');

    this.process = spawn(
      python,
      [
        '-m',
        'uvicorn',
        'backend.main:app',
        '--host',
        '127.0.0.1',
        '--port',
        String(this.port)
      ],
      {
        cwd: path.join(process.cwd()),
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          BACKEND_PORT: String(this.port)
        }
      }
    );

    this.process.stdout.on('data', (d) => console.log(`[py] ${d.toString().trim()}`));
    this.process.stderr.on('data', (d) => console.error(`[py] ${d.toString().trim()}`));
    this.process.on('exit', (code, signal) => {
      console.log(`[py] exit code=${code} signal=${signal}`);
      this.process = null;
    });

    // Esperar a que /health responda
    await this.waitForHealth(10000);
  }

  async waitForHealth(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    const check = (): Promise<boolean> => new Promise((resolve) => {
      const req = http.request({
        host: '127.0.0.1',
        port: this.port,
        path: '/health',
        method: 'GET'
      }, (res) => resolve(res.statusCode === 200));
      req.on('error', () => resolve(false));
      req.end();
    });

    while (Date.now() < deadline) {
      const ok = await check();
      if (ok) return;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error('Backend FastAPI no respondió a tiempo');
  }

  stop(): void {
    if (!this.process) return;
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(this.process.pid), '/f', '/t']);
    } else {
      this.process.kill('SIGTERM');
    }
    this.process = null;
  }

  getPort(): number {
    return this.port;
  }
}



