import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import type { InfoesteEvent, ICourseRepository } from "@infoeste/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_APP_DIR = path.resolve(__dirname, "../../../web");
const WEB_PUBLIC_DIR = path.join(WEB_APP_DIR, "public");
const EVENTS_FILE_PATH = path.join(WEB_PUBLIC_DIR, "events.json");
const PREVIEW_PORT = 4173;

export class ConsoleUI {
  constructor(private readonly courseRepository: ICourseRepository) { }

  async render(): Promise<void> {
    try {
      console.log("Buscando eventos...");
      const events = await this.courseRepository.getGroupedEvents();
      console.log(`Eventos carregados: ${events.length}`);

      await this.persistEvents(events);
      await this.buildWebApp();

      const server = await this.startPreviewServer();

      try {
        await this.openInBrowser(server.url);
      } finally {
        await server.stop();
      }
    } catch (error) {
      console.error("Ocorreu um erro:", error);
    }
  }

  private async persistEvents(events: InfoesteEvent[]): Promise<void> {
    await fs.mkdir(WEB_PUBLIC_DIR, { recursive: true });
    const json = JSON.stringify(events, null, 2);
    await fs.writeFile(EVENTS_FILE_PATH, json, "utf-8");
    console.log(`Eventos salvos em ${EVENTS_FILE_PATH}`);
  }

  private async buildWebApp(): Promise<void> {
    console.log("Gerando build do frontend...");
    await this.runNpmScript("build");
  }

  private async startPreviewServer(): Promise<{ url: string; stop: () => Promise<void> }> {
    console.log("Iniciando servidor de visualização...");
    const previewProcess = this.spawnNpmScript("preview", [
      "--host",
      "127.0.0.1",
      "--port",
      PREVIEW_PORT.toString(),
      "--strictPort",
    ]);

    await this.waitForPreviewReady(previewProcess);

    return {
      url: `http://127.0.0.1:${PREVIEW_PORT}`,
      stop: async () => {
        if (!previewProcess.killed) {
          previewProcess.kill();
        }
        await once(previewProcess, "exit");
        console.log("Servidor de visualização finalizado.");
      },
    };
  }

  private async openInBrowser(url: string): Promise<void> {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
      defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    console.log("Visualização aberta no navegador controlado pelo Puppeteer.");

    await new Promise<void>((resolve) => {
      browser.on("disconnected", () => resolve());
    });
  }

  private async runNpmScript(script: string, extraArgs: string[] = []): Promise<void> {
    const { command, args } = this.getNpmCommand(script, extraArgs);

    const child = spawn(command, args, {
      cwd: WEB_APP_DIR,
      stdio: "inherit",
    });

    await once(child, "exit");
    if (child.exitCode !== 0) {
      throw new Error(`Falha ao executar npm run ${script}`);
    }
  }

  private spawnNpmScript(script: string, extraArgs: string[] = []): ChildProcess {
    const { command, args } = this.getNpmCommand(script, extraArgs);

    const child = spawn(command, args, {
      cwd: WEB_APP_DIR,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stderr?.on("data", (data) => {
      const message = data.toString();
      console.error(`[web] ${message.trim()}`);
    });

    child.on("exit", (code) => {
      if (code !== null && code !== 0) {
        console.error(`npm run ${script} finalizado com código ${code}`);
      }
    });

    return child;
  }

  private getNpmCommand(script: string, extraArgs: string[]): { command: string; args: string[] } {
    const baseArgs = ["run", script];
    if (extraArgs.length > 0) {
      baseArgs.push("--", ...extraArgs);
    }

    const npmExecPath = process.env.npm_execpath;
    if (npmExecPath) {
      return {
        command: process.execPath,
        args: [npmExecPath, ...baseArgs],
      };
    }

    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    return { command, args: baseArgs };
  }

  private async waitForPreviewReady(previewProcess: ChildProcess): Promise<void> {
    const stdout = previewProcess.stdout;
    if (!stdout) {
      throw new Error("Processo do preview não possui stdout para leitura.");
    }

    let resolved = false;
    await new Promise<void>((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        const message = chunk.toString();
        const trimmed = message.trim();
        console.log(`[web] ${trimmed}`);
        if (trimmed.includes("Local:")) {
          resolved = true;
          stdout.off("data", onData);
          resolve();
        }
      };

      const onError = (error: Error) => {
        if (!resolved) {
          stdout.off("data", onData);
          reject(error);
        }
      };

      const onExit = (code: number | null) => {
        if (!resolved) {
          stdout.off("data", onData);
          reject(new Error(`Servidor de preview finalizado antes de iniciar (code: ${code ?? "null"})`));
        }
      };

      stdout.on("data", onData);
      previewProcess.once("error", onError);
      previewProcess.once("exit", onExit);
    });
  }
}
