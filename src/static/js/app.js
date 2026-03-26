// Конфигурация
const WS_URL = "ws://localhost:8000/ws/audio";
const LLM_URL = "/llm/structure";

// Состояние
let ws = null;
let audioContext = null;
let processor = null;
let globalStream = null;
let recordingTime = 0;
let timerInterval = null;
let animationFrame = null;

// Элементы DOM
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");
const btnClear = document.getElementById("btnClear");
const btnMakeStructured = document.getElementById("btnMakeStructured");
const btnCopy = document.getElementById("btnCopy");
const btnCopyTranscript = document.getElementById("btnCopyTranscript");
const btnExport = document.getElementById("btnExport");
const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const statusTime = document.getElementById("statusTime");
const transcriptEl = document.getElementById("transcript");
const structuredEl = document.getElementById("structured");
const connectionBadge = document.getElementById("connectionBadge");
const visualizationBars = document.getElementById("visualizationBars");
const btnDownload = document.getElementById("downloadBtn");

// Инициализация визуализации
for (let i = 0; i < 30; i++) {
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.style.height = Math.random() * 30 + 10 + "px";
  visualizationBars.appendChild(bar);
}

// Обработчики событий
btnStart.onclick = startRecording;
btnStop.onclick = stopRecording;
btnClear.onclick = clearTranscript;
btnMakeStructured.onclick = makeStructured;
btnCopy.onclick = () => copyText(structuredEl.textContent);
btnCopyTranscript.onclick = () => copyText(transcriptEl.textContent || transcriptEl.dataset.confirmed || "");
btnExport.onclick = exportStructured;
btnDownload.onclick = donwloadDocument;

// Вспомогательные функции
async function donwloadDocument() {
  try {
        const response = await fetch("http://127.0.0.1:8000/document/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                result: structuredEl.textContent
            })
        })
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "medcard.docx";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        });

        if (!response.ok) {
            throw new Error("Ошибка при скачивании файла");
        }

    } catch (error) {
        console.error(error);
        alert("Не удалось скачать документ");
    }
}

function setStatus(state, message) {
  statusIndicator.className = "status-indicator";
  if (state === "recording") {
    statusIndicator.classList.add("recording");
    connectionBadge.textContent = "🎤 Запись";
    connectionBadge.style.background = "var(--danger)";
    connectionBadge.style.color = "white";
  } else if (state === "connected") {
    statusIndicator.classList.add("connected");
    connectionBadge.textContent = "✅ Подключено";
    connectionBadge.style.background = "var(--success)";
    connectionBadge.style.color = "white";
  } else if (state === "processing") {
    statusIndicator.classList.add("processing");
    connectionBadge.textContent = "⚙️ Обработка";
    connectionBadge.style.background = "var(--warning)";
    connectionBadge.style.color = "white";
  } else {
    connectionBadge.textContent = "📡 WebSocket";
    connectionBadge.style.background = "";
    connectionBadge.style.color = "";
  }
  statusText.textContent = message;
}

function startTimer() {
  recordingTime = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    recordingTime++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(recordingTime / 60);
  const secs = recordingTime % 60;
  statusTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function clearTranscript() {
  transcriptEl.dataset.confirmed = "";
  transcriptEl.textContent = "";
  structuredEl.textContent = "";
  setStatus("idle", "Готов к записи");
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus("idle", "Скопировано в буфер обмена");
    setTimeout(() => setStatus("idle", "Готов к записи"), 2000);
  } catch (e) {
    console.error("Copy failed", e);
  }
}

function exportStructured() {
  const text = structuredEl.textContent;
  if (!text) return;

  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `medical-record-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setStatus("idle", "Файл экспортирован");
}



// WebSocket функции (те же, что и в вашем коде)
function initWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(WS_URL);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    transcriptEl.dataset.confirmed = "";
    transcriptEl.textContent = "";
    setStatus("connected", "WebSocket: подключено");
    ws.send(JSON.stringify({type: 'hello', role: 'client'}));
  };

  ws.onmessage = (evt) => {
    let data = evt.data;
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        handleServerMessage(msg);
      } catch (e) {
        console.log("Received text:", data);
      }
    }
  };

  ws.onclose = () => {
    setStatus("idle", "WebSocket: отключено");
  };

  ws.onerror = () => {
    setStatus("idle", "WebSocket: ошибка соединения");
  };
}

function handleServerMessage(msg) {
  if (!msg.type) return;

  if (msg.type === 'partial') {
    transcriptEl.classList.add("partial");
    transcriptEl.textContent = (transcriptEl.dataset.confirmed || "") + " " + msg.text;
  } else if (msg.type === 'final') {
    transcriptEl.classList.remove("partial");
    const confirmed = transcriptEl.dataset.confirmed || "";
    const newConfirmed = (confirmed + " " + msg.text).trim();
    transcriptEl.dataset.confirmed = newConfirmed;
    transcriptEl.textContent = newConfirmed;
  } else if (msg.type === 'info') {
    setStatus("connected", "WS: " + (msg.msg || 'info'));
  } else if (msg.type === 'error') {
    setStatus("idle", "Ошибка: " + (msg.msg || ''));
  }
}

// Аудио функции (ваши существующие)
function floatTo16BitPCM(float32Array) {
  const l = float32Array.length;
  const buffer = new ArrayBuffer(l * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < l; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function downsampleBuffer(buffer, sampleRate, outSampleRate = 16000) {
  if (outSampleRate === sampleRate) return buffer;
  const sampleRateRatio = sampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.round(i * sampleRateRatio);
    const end = Math.round((i + 1) * sampleRateRatio);
    let sum = 0;
    for (let j = start; j < end && j < buffer.length; j++) {
      sum += buffer[j];
    }
    result[i] = sum / (end - start);
  }
  return result;
}

function updateVisualization(audioData) {
  if (!animationFrame) {
    const animate = () => {
      const bars = document.querySelectorAll('.bar');
      bars.forEach(bar => {
        const height = 20 + Math.random() * 40;
        bar.style.height = height + 'px';
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }
}

async function startRecording() {
  btnStart.disabled = true;
  btnStop.disabled = false;
  initWebSocket();
  setStatus("recording", "Запись...");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    globalStream = stream;
    audioContext = new (AudioContext || webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    const inputSampleRate = audioContext.sampleRate;

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      updateVisualization(inputData);

      const downsampled = downsampleBuffer(inputData, inputSampleRate, 16000);
      const pcm16Buffer = floatTo16BitPCM(downsampled);
      const b64 = arrayBufferToBase64(pcm16Buffer);

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'audio',
          encoding: 'pcm16',
          sample_rate: 16000,
          data: b64
        }));
      }
    };

    startTimer();

  } catch (err) {
    console.error(err);
    setStatus("idle", "Ошибка доступа к микрофону");
    btnStart.disabled = false;
    btnStop.disabled = true;
  }
}

function stopRecording() {
  btnStart.disabled = false;
  btnStop.disabled = true;

  if (processor) {
    processor.disconnect();
    processor.onaudioprocess = null;
    processor = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  if (globalStream) {
    globalStream.getTracks().forEach(t => t.stop());
    globalStream = null;
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({type: 'eof'}));
    setStatus("processing", "Обработка...");
    ws.close();
  }

  stopTimer();
  setStatus("idle", "Запись остановлена");

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

async function makeStructured() {
  const rawText = (transcriptEl.dataset.confirmed || "").trim();
  if (!rawText) {
    alert("Сначала запишите речь");
    return;
  }

  setStatus("processing", "Отправка в LLM...");
  structuredEl.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';

  try {
    const resp = await fetch(LLM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: rawText })
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const j = await resp.json();
    structuredEl.textContent = JSON.stringify(j.structured || j, null, 2);
    setStatus("idle", "Готово");
  } catch (e) {
    console.error(e);
    setStatus("idle", "Ошибка LLM");
    structuredEl.textContent = "Ошибка: " + e.message;
  }
}

// Cleanup
window.addEventListener("beforeunload", () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  if (globalStream) {
    globalStream.getTracks().forEach(t => t.stop());
  }
  stopTimer();
});