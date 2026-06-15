import React, { useState, useEffect } from "react";
import { getAccessToken, initAuth, googleSignIn } from "../lib/auth";
import {
  Database,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";

interface GoogleSheetsIntegrationProps {
  dataToExport?: unknown[][];
  sheetName?: string;
  onImport?: (data: unknown[][]) => void;
}

export function GoogleSheetsIntegration({
  dataToExport,
  sheetName = "Dane Aplikacji",
  onImport,
}: GoogleSheetsIntegrationProps) {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState("");

  useEffect(() => {
    const unsubscribe = initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true),
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
      }
    } catch (err: unknown) {
      console.error("Login failed:", err);
      setMessage({ type: "error", text: "Błąd logowania do Google" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleExport = async () => {
    if (!dataToExport || dataToExport.length === 0) {
      setMessage({ type: "error", text: "Brak danych do eksportu" });
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    const confirmed = window.confirm(
      `Czy na pewno chcesz utworzyć nowy Arkusz Google i wyeksportować dane?`,
    );
    if (!confirmed) return;

    setIsExporting(true);
    setMessage(null);

    try {
      // 1. Create a new Spreadsheet
      const createRes = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              title: `Eksport z Aplikacji - ${new Date().toLocaleDateString()}`,
            },
            sheets: [{ properties: { title: sheetName } }],
          }),
        },
      );

      if (!createRes.ok) throw new Error("Błąd tworzenia arkusza");
      const createData = await createRes.json();
      const newSpreadsheetId = createData.spreadsheetId;

      // 2. Append data to the new spreadsheet
      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${newSpreadsheetId}/values/${sheetName}!A1:APPEND?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: dataToExport,
          }),
        },
      );

      if (!appendRes.ok) throw new Error("Błąd zapisu danych do arkusza");

      setSpreadsheetId(newSpreadsheetId);
      setMessage({
        type: "success",
        text: `Pomyślnie wyeksportowano dane. ID Arkusza: ${newSpreadsheetId}`,
      });
    } catch (error: unknown) {
      console.error("Export error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas eksportu";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!spreadsheetId) {
      setMessage({
        type: "error",
        text: "Podaj ID arkusza do pobrania danych",
      });
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:Z`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        if (res.status === 404)
          throw new Error(
            "Nie znaleziono arkusza. Sprawdź ID oraz czy posiadasz dostęp.",
          );
        if (res.status === 400)
          throw new Error(
            "Błędne zapytanie. Sprawdź czy nazwa zakładki arkusza jest zgodna.",
          );
        throw new Error("Błąd odczytu danych");
      }

      const data = await res.json();
      if (!data.values || data.values.length === 0) {
        throw new Error("Arkusz jest pusty");
      }

      if (onImport) {
        onImport(data.values);
      }

      setMessage({
        type: "success",
        text: `Pomyślnie pobrano ${data.values.length} wierszy`,
      });
    } catch (error: unknown) {
      console.error("Import error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas importu";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Database className="text-emerald-500" size={24} />
        <h3 className="text-lg font-bold text-white">
          Integracja Google Sheets
        </h3>
      </div>

      <p className="text-sm text-neutral-400">
        Eksportuj i importuj dane ze swojego Google Drive (jako arkusze
        kalkulacyjne).
      </p>

      {needsAuth ? (
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md border border-neutral-700 transition"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          {isLoggingIn ? "Logowanie..." : "Zaloguj się z Google"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
            <h4 className="text-sm font-semibold text-neutral-300 mb-3">
              Eksport danych do nowego arkusza
            </h4>
            <button
              onClick={handleExport}
              disabled={
                isExporting || !dataToExport || dataToExport.length === 0
              }
              className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-medium transition"
            >
              <Upload size={18} />
              {isExporting
                ? "Eksportowanie..."
                : "Eksportuj z aplikacji do Sheets"}
            </button>
          </div>

          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3">
            <h4 className="text-sm font-semibold text-neutral-300 mb-1">
              Import danych z arkusza
            </h4>
            <input
              type="text"
              placeholder="ID arkusza z adresu URL (np. 1BxiMvs0Xrx...)"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleImport}
              disabled={isImporting || !spreadsheetId}
              className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded font-medium transition"
            >
              <Download size={18} />
              {isImporting ? "Pobieranie..." : "Importuj z Sheets do Aplikacji"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${
            message.type === "error"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          {message.type === "error" ? (
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          )}
          <span className="break-all">{message.text}</span>
        </motion.div>
      )}
    </div>
  );
}
