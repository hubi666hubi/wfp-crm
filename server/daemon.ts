import cron from 'node-cron';
import { exec } from 'child_process';

// OMEGA MONETIZATION DAEMON
// Ten skrypt to niezależny silnik, który działa w tle na Twoim serwerze.
// Sprawia, że infrastruktura uruchamia maszynkę do pieniędzy w pełni natywnie.

console.log('⚡ OMEGA DAEMON STARTING...');
console.log('⏱ Harmonogram ustawiony: co 30 minut (0, 30 minuty każdej godziny).');

const runPipeline = () => {
    console.log(`\n[${new Date().toISOString()}] 🚀 Uruchamiam cykl OMEGA Engine...`);

    // Krok 1: Scraper
    console.log('-> Etap 1: Inicjalizacja Scrapera (Python)...');
    exec('.venv\\Scripts\\python.exe backend\\lead_scraper.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Błąd Scrapera: ${error.message}`);
            return;
        }
        if (stdout) console.log(stdout);

        // Krok 2: Qualifier
        console.log('-> Etap 2: AI Kwalifikacja (Python)...');
        exec('.venv\\Scripts\\python.exe backend\\lead_qualifier.py', (error2, stdout2, stderr2) => {
            if (error2) {
                console.error(`❌ Błąd Kwalifikatora: ${error2.message}`);
                return;
            }
            if (stdout2) console.log(stdout2);

            // Krok 3: Sales Agent (Outbound)
            console.log('-> Etap 3: Uderzenie Outboundowe (Sales Agent)...');
            exec('npx tsx server\\sales_agent.ts', (error3, stdout3, stderr3) => {
                if (error3) {
                    console.error(`❌ Błąd Agenta Sprzedaży: ${error3.message}`);
                    return;
                }
                if (stdout3) console.log(stdout3);
                console.log(`✅ Cykl OMEGA pomyślnie zakończony. Czekam na kolejne okno czasowe...`);
            });
        });
    });
};

// Start cron
cron.schedule('0,30 * * * *', () => {
    runPipeline();
});
