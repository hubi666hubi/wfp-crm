# Skrypt automatyzujący konfigurację projektu Google Cloud dla AI Edge Portal (OMEGA)
$ErrorActionPreference = "Stop"

$PROJECT_ID = "nekropolis-edge-matrix"
$BUCKET_NAME = "gs://nekropolis-edge-matrix-models"

Write-Host "⚡ OMEGA: Inicjalizacja konfiguracji GCP dla AI Edge Portal (LiteRT)..." -ForegroundColor Cyan

# 1. Tworzenie projektu
Write-Host "Tworzenie projektu GCP: $PROJECT_ID..."
gcloud projects create $PROJECT_ID --name="OMEGA AI Edge Models"
gcloud config set project $PROJECT_ID

# 2. Informacja o bilingu
Write-Host "⚠️ UWAGA: Google AI Edge Portal wymaga włączonych płatności (Billing) do stworzenia kontenera GCS." -ForegroundColor Yellow
Write-Host "Przejdź do: https://console.cloud.google.com/billing i połącz ten projekt z kontem billingowym." -ForegroundColor Yellow
Write-Host "Naciśnij Enter, gdy płatności będą aktywne, aby kontynuować..."
Read-Host

# 3. Tworzenie Bucketa na modele
Write-Host "Tworzenie Google Cloud Storage Bucket ($BUCKET_NAME) na modele .tflite / .bin..."
gcloud storage buckets create $BUCKET_NAME --location=EU --uniform-bucket-level-access

Write-Host "✅ Konfiguracja GCP zakończona!" -ForegroundColor Green
Write-Host "🎯 Twój Project ID to: $PROJECT_ID" -ForegroundColor Green
Write-Host "Kolejny krok: Skopiuj ten Project ID i wyślij w odpowiedzi do aep-contact@google.com." -ForegroundColor Magenta
