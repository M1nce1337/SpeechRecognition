from vosk import Model, KaldiRecognizer
import sounddevice as sd
import queue
import sqlite3
import json

MODEL_PATH = "vosk-model-small-ru-0.22"  
DB_PATH = "database.db"
SAMPLE_RATE = 16000


model = Model(MODEL_PATH)
recognizer = KaldiRecognizer(model, SAMPLE_RATE)
audio_queue = queue.Queue()

sd.default.device = 1  

def text_to_sql(text):
    text = text.lower()

    if "показать" in text and "пользовател" in text:
        return "SELECT * FROM users;"
    elif "удалить" in text and "пользовател" in text:
        return "DELETE FROM users;"
    elif "добавить" in text and "пользовател" in text:
        parts = text.split()

        if len(parts) >= 3:
            name = parts[-1]
            return f"INSERT INTO users (name) VALUES ('{name}');"
        
    return None

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);
""")
conn.commit()

def callback(indata, frames, time, status):
    audio_queue.put(bytes(indata))

print("🎙 Говори SQL-команды. (Ctrl+C — выход)")

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
                    sql = text_to_sql(text)

                    if sql:
                        print(f"💾 SQL → {sql}")
                        
                        try:
                            cur.execute(sql)
                            conn.commit()
                            rows = cur.fetchall() if sql.strip().lower().startswith("select") else None

                            if rows:
                                for r in rows:
                                    print("📄", r)
                            else:
                                print("✅ Запрос выполнен.")

                        except Exception as e:
                            print("❌ Ошибка SQL:", e)

                    else:
                        print("🤔 Не удалось понять команду.")
                        
    except KeyboardInterrupt:
        print("\n✅ Работа завершена.")
        conn.close()