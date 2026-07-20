import yt_dlp
import os

os.makedirs('downloads/trippy', exist_ok=True)

ydl_opts = {
    'format': 'best',
    'outtmpl': 'downloads/trippy/%(title)s.%(ext)s',
    'noplaylist': True,
    'max_downloads': 3,
}

print("Rozpoczynam pobieranie 3 psychodelicznych/AI wideo z YouTube (max 1080p)...")
try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download(['ytsearch3:ai psychedelic visual loop 4k'])
    print("Pobieranie zakończone!")
except Exception as e:
    print(f"Błąd podczas pobierania: {e}")
