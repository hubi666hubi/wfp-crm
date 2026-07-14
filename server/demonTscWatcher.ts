import { spawn } from "child_process";
import nodemailer from "nodemailer";
import path from "path";

class DemonTscWatcher {
  private isWatcherActive: boolean = true;
  // Use dynamic path instead of hardcoded Windows path
  private projectRoot: string = process.cwd();

  constructor() {
    console.log("\x1b[35m[DEMON 02 - TSC WATCHER] Straznik skladni i kompilacji zostal aktywowany.\x1b[0m");
  }

  private async sendAlertEmail(errorOutput: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: parseInt(process.env.SMTP_PORT || "2525"),
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || ""
      }
    });

    const mailOptions = {
      from: '"W.F.P. Watchdog Core" <secops@antigravity.dev>',
      to: "hubi666hubi@gmail.com",
      subject: "ALARM SYSTEMOWY: Wykryto bledy kompilacji TypeScript!",
      html: `<h1>Wykryto regresje kodu</h1><p>Kompilator zglosil bledy blokujace uruchomienie jadra:</p><pre style="background:#1e1e1e;color:#f1f1f1;padding:15px;">${errorOutput}</pre>`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("[ALERT TRANSMISSION] Raport o bledach typowania zostal pomyslnie wyslany.");
    } catch (err) {
      console.error("[TSC WATCHER] Blad podczas wysylki maila alarmowego:", err);
    }
  }

  public async startContinuousAuditLoop(): Promise<void> {
    // Skip TSC watching in production — no tsconfig or source files available
    if (process.env.NODE_ENV === 'production' || process.env.BACKEND_ONLY === 'true') {
      console.log("[DEMON 02 - TSC WATCHER] Production mode — TypeScript audit skipped (no source files on server).");
      return;
    }

    while (this.isWatcherActive) {
      try {
        await new Promise((resolve) => {
          // Use cross-platform npx command
          const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
          const tsc = spawn(npxCmd, ["tsc", "--noEmit"], { cwd: this.projectRoot, shell: false });
          let errorLog = "";

          // CRITICAL: handle spawn errors to prevent uncaught 'error' event from killing the server
          tsc.on("error", (err) => {
            console.error("[DEMON 02 - TSC WATCHER] Spawn error (npx not found?):", err.message);
            resolve(false);
          });

          tsc.stderr.on("data", (data) => { errorLog += data.toString(); });
          tsc.stdout.on("data", (data) => { if (data.toString().includes("error")) errorLog += data.toString(); });

          tsc.on("close", async (code) => {
            if (code !== 0 && code !== null) {
              console.warn(`\x1b[31m[ALARM TSC] Wykryto nieprawidlowosci struktury typow.\x1b[0m`);
              await this.sendAlertEmail(errorLog);
            } else {
              console.log("[TSC NOMINAL] Brak regresji w plikach TypeScript. Kod stabilny.");
            }
            resolve(true);
          });
        });

        // Check every 60 seconds
        await new Promise(resolve => setTimeout(resolve, 60000));
      } catch (loopErr: any) {
        console.error("Blad petli straznika kompilacji:", loopErr.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

export const demonTscWatcher = new DemonTscWatcher();
