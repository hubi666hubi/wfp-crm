import { spawn } from "child_process";
import nodemailer from "nodemailer";

class DemonTscWatcher {
  private isWatcherActive: boolean = true;
  private projectRoot: string = "C:\\Users\\brend\\Desktop\\XX2";

  constructor() {
    console.log("\x1b[35m[DEMON 02 - TSC WATCHER] 👁️ Strażnik składni i kompilacji został aktywowany.\x1b[0m");
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
      subject: "🚨 ALARM SYSTEMOWY: Wykryto błędy kompilacji TypeScript!",
      html: `<h1>Wykryto regresję kodu</h1><p>Kompilator zgłosił błędy blokujące uruchomienie jądra:</p><pre style="background:#1e1e1e;color:#f1f1f1;padding:15px;">${errorOutput}</pre>`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("🟢 [ALERT TRANSMISSION] Raport o błędach typowania został pomyślnie wysłany.");
    } catch (err) {
      console.error("❌ Błąd krytyczny podczas wysyłki maila alarmowego:", err);
    }
  }

  public async startContinuousAuditLoop(): Promise<void> {
    while (this.isWatcherActive) {
      try {
        await new Promise((resolve) => {
          const tsc = spawn("npx.cmd", ["tsc", "--noEmit"], { cwd: this.projectRoot, shell: true });
          let errorLog = "";

          tsc.stderr.on("data", (data) => { errorLog += data.toString(); });
          tsc.stdout.on("data", (data) => { if (data.toString().includes("error")) errorLog += data.toString(); });

          tsc.on("close", async (code) => {
            if (code !== 0) {
              console.warn(`\x1b[31m[ALARM TSC] Wykryto nieprawidłowości struktury typów. Inicjacja wysyłki raportu SecOps.\x1b[0m`);
              await this.sendAlertEmail(errorLog);
            } else {
              console.log("[TSC NOMINAL] Brak regresji w plikach TypeScript. Kod stabilny.");
            }
            resolve(true);
          });
        });

        // Taktowanie sprawdzania stabilności kodu (np. co 60 sekund)
        await new Promise(resolve => setTimeout(resolve, 60000));
      } catch (loopErr: any) {
        console.error("Błąd pętli strażnika kompilacji:", loopErr.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

export const demonTscWatcher = new DemonTscWatcher();
