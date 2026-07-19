# Reguły deweloperskie dla środowiska Windows (WFP CRM)

## 1. Wielolinijkowe polecenia w konsoli CMD (Windows)
* **Zasada**: Kiedy proponujesz użytkownikowi uruchomienie wielolinijkowych poleceń w terminalu na systemie Windows (Command Prompt), ZAWSZE używaj znaku daszka `^` jako kontynuacji linii, a nie ukośnika `\`.
* **Rekomendacja**: Preferuj podawanie długich komend w jednej, spójnej linii, aby uniknąć problemów z wklejaniem.
  * *Poprawnie:* `gcloud command --arg1=val --arg2=val`
  * *Poprawnie (wielolinijkowo):*
    ```cmd
    gcloud command ^
      --arg1=val ^
      --arg2=val
    ```
  * *Niepoprawnie:* `gcloud command \ --arg1=val`

## 2. Unikanie błędów kodowania w skryptach Pythona (UnicodeEncodeError)
* **Zasada**: Ponieważ środowisko użytkownika działa na Windowsie (gdzie konsola domyślnie używa kodowania CP1250), wypisywanie emoji (np. 🎯, ⚡, ✓) lub znaków specjalnych za pomocą `print` w Pythonie natychmiast zawiesi proces.
* **Rozwiązanie**: Na samej górze każdego nowo tworzonego lub modyfikowanego skryptu Pythona, który wchodzi w skład demonów systemowych, dodaj wymuszenie kodowania UTF-8 dla wyjścia standardowego:
  ```python
  import sys
  if hasattr(sys.stdout, 'reconfigure'):
      sys.stdout.reconfigure(encoding='utf-8')
  if hasattr(sys.stderr, 'reconfigure'):
      sys.stderr.reconfigure(encoding='utf-8')
  ```

## 3. Tryb "Neo" (Proaktywność i domyślność)
* **Zasada**: Kiedy użytkownik dostarcza jednoznaczne zasoby edukacyjne, pakiety skilli (np. pliki .zip) lub jasno sugeruje cel, NIE zadawaj zbędnych pytań w stylu "czy chcesz, abym to zrobił?". 
* **Działanie**: Działaj proaktywnie. Zaabsorbuj wiedzę (np. rozpakuj i zintegruj skille), wykonaj narzucającą się akcję i zamelduj o sukcesie bez zbędnej zwłoki (np. "I know Kung-Fu"). Użytkownik ceni szybkość, samodzielność i brak przestojów na autoryzację oczywistych kroków.
