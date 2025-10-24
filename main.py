import sounddevice as sd
import queue
import json
import datetime
import os
import pandas as pd
from vosk import Model, KaldiRecognizer

# === НАСТРОЙКИ ===
MODEL_PATH = "vosk-model-small-ru-0.22"  # Путь к модели
TXT_FILE = "transcript.txt"
XLSX_FILE = "transcript.xlsx"
SAMPLE_RATE = 16000

# === ИНИЦИАЛИЗАЦИЯ ===
model = Model(MODEL_PATH)
recognizer = KaldiRecognizer(model, SAMPLE_RATE)
audio_queue = queue.Queue()

sd.default.device = 1  # ← Поставь свой номер микрофона

# === ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ EXCEL ===
def append_to_excel(text):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_row = {"Время": timestamp, "Текст": text}

    if os.path.exists(XLSX_FILE):
        df = pd.read_excel(XLSX_FILE)
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    else:
        df = pd.DataFrame([new_row])

    df.to_excel(XLSX_FILE, index=False)

# === ОБРАБОТКА ПОТОКА ===
def callback(indata, frames, time, status):
    audio_queue.put(bytes(indata))

print("🎙 Система готова. Говори в микрофон (Ctrl+C — выход).")

with open(TXT_FILE, "a", encoding="utf-8") as f:
    with sd.RawInputStream(samplerate=SAMPLE_RATE, blocksize=8000, dtype='int16',
                           channels=1, callback=callback):
        try:
            while True:
                data = audio_queue.get()
                if recognizer.AcceptWaveform(data):
                    result = json.loads(recognizer.Result())
                    text = result.get("text", "")
                    if text:
                        print("🗣", text)
                        f.write(text + "\n")
                        f.flush()
                        append_to_excel(text)
        except KeyboardInterrupt:
            print("\n✅ Распознавание завершено.")

