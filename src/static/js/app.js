// ==================== КЛАСС STRUCTURED MEDICAL VIEW ====================
class StructuredMedicalView {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        this.options = {
            onEdit: null,
            onExport: null,
            ...options
        };

        this.currentData = null;
        this.init();
    }

    init() {
        this.injectStyles();
        this.createStructure();
        this.initEventHandlers();
    }

    injectStyles() {
        if (document.getElementById('structured-view-styles')) return;

        const style = document.createElement('style');
        style.id = 'structured-view-styles';
        style.textContent = `
            .structured-view {
                position: relative;
            }
            .medical-card {
                background: white;
                border-radius: var(--radius);
                margin-bottom: 20px;
                overflow: hidden;
                transition: all 0.3s ease;
                border: 1px solid var(--gray-200);
                animation: slideIn 0.3s ease;
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .medical-card:hover {
                box-shadow: var(--shadow-md);
                transform: translateY(-2px);
            }
            .medical-card-header {
                background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
                padding: 16px 20px;
                border-bottom: 2px solid var(--primary-200);
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                user-select: none;
            }
            .medical-card-header-left {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            }
            .medical-card-header h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
                color: var(--gray-800);
            }
            .medical-card-icon {
                width: 24px;
                height: 24px;
                color: var(--primary);
            }
            .medical-card-toggle {
                width: 20px;
                height: 20px;
                transition: transform 0.3s ease;
                color: var(--gray-500);
            }
            .medical-card.collapsed .medical-card-toggle {
                transform: rotate(-90deg);
            }
            .medical-card.collapsed .medical-card-body {
                display: none;
            }
            .medical-card-body {
                padding: 20px;
                animation: fadeIn 0.3s ease;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .medical-field {
                margin-bottom: 14px;
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                padding: 8px 0;
                border-bottom: 1px solid var(--gray-100);
            }
            .medical-field:last-child {
                border-bottom: none;
            }
            .medical-field-label {
                font-weight: 600;
                color: var(--primary);
                min-width: 140px;
                font-size: 0.9rem;
            }
            .medical-field-value {
                color: var(--gray-700);
                flex: 1;
                line-height: 1.5;
                font-size: 0.95rem;
            }
            .medical-list {
                margin: 0;
                padding-left: 20px;
            }
            .medical-list li {
                margin-bottom: 8px;
                line-height: 1.5;
                color: var(--gray-700);
            }
            .medical-table {
                width: 100%;
                border-collapse: collapse;
            }
            .medical-table td {
                padding: 10px 8px;
                border-bottom: 1px solid var(--gray-200);
                vertical-align: top;
            }
            .medical-table td:first-child {
                font-weight: 600;
                color: var(--primary);
                width: 40%;
            }
            .medical-tag {
                display: inline-block;
                padding: 4px 12px;
                background: var(--gray-100);
                border-radius: 20px;
                font-size: 0.85rem;
                color: var(--gray-700);
                margin: 4px 6px 4px 0;
            }
            .medical-loading {
                text-align: center;
                padding: 40px;
                color: var(--gray-500);
            }
            .medical-loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--gray-200);
                border-top-color: var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .medical-error {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 16px;
                border-radius: var(--radius-sm);
                margin-bottom: 16px;
            }
            .medical-empty {
                text-align: center;
                padding: 40px;
                color: var(--gray-500);
                background: var(--gray-50);
                border-radius: var(--radius-sm);
            }
            @media (max-width: 768px) {
                .medical-field {
                    flex-direction: column;
                    gap: 6px;
                }
                .medical-field-label {
                    min-width: auto;
                }
                .medical-card-header {
                    padding: 12px 16px;
                }
                .medical-card-body {
                    padding: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createStructure() {
        this.container.classList.add('structured-view');
        this.container.innerHTML = `<div class="medical-cards-container"></div>`;
        this.cardsContainer = this.container.querySelector('.medical-cards-container');
    }

    initEventHandlers() {
        this.container.addEventListener('click', (e) => {
            const header = e.target.closest('.medical-card-header');
            if (header) {
                const card = header.closest('.medical-card');
                if (card) card.classList.toggle('collapsed');
            }
            const editBtn = e.target.closest('.medical-edit-btn');
            if (editBtn && this.options.onEdit) {
                const field = editBtn.closest('.medical-field');
                if (field) {
                    const label = field.querySelector('.medical-field-label')?.textContent.replace(':', '');
                    const value = field.querySelector('.medical-field-value')?.textContent;
                    this.options.onEdit(label, value);
                }
            }
        });
    }

    // ==================== УНИВЕРСАЛЬНЫЙ РЕНДЕР ====================

    toHumanReadable(key) {
    if (!key) return '';

    const fieldNames = {
        'complaints': 'Жалобы',
        'anamnesis': 'Анамнез заболевания',
        'life_anamnesis': 'Анамнез жизни',
        'status_praesens': 'Объективный статус',
        'recommendations': 'Рекомендации',
        'diagnosis': 'Диагноз',
        'patient_info': 'Информация о пациенте',
        'treatment': 'Назначения',
        'examination': 'Обследование',
        'lab_tests': 'Лабораторные исследования'
    };

    return fieldNames[key] || key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase());
}

    transformData(data) {
        if (data === null || data === undefined) return null;

        // Массив
        if (Array.isArray(data)) {
            return data
                .map(item => {
                    if (typeof item === 'string') {
                        const trimmed = item.trim();
                        if (trimmed.includes(',')) {
                            const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
                            if (parts.length > 1) return parts;
                        }
                        return item;
                    }
                    if (typeof item === 'object' && item !== null) {
                        return this.transformData(item);
                    }
                    return item;
                })
                .filter(item => item !== null && item !== undefined && item !== '');
        }

        // Примитив
        if (typeof data !== 'object') return data;

        const result = {};

        for (const [key, value] of Object.entries(data)) {
            let processed = value;

            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed.includes(',')) {
                    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
                    if (parts.length > 1) processed = parts;
                }
            } else if (typeof value === 'object' && value !== null) {
                processed = this.transformData(value);
            }

            // Убираем пустые значения
            if (processed === '' ||
                processed === null ||
                processed === undefined ||
                (Array.isArray(processed) && processed.length === 0) ||
                (typeof processed === 'object' && !Array.isArray(processed) && Object.keys(processed).length === 0)) {
                continue;
            }

            result[key] = processed;
        }

        return result;
    }

    renderAnyValue(value) {
        if (value == null) return '';

        const escape = (v) => this.escapeHtml(String(v));

        // Строка / число / boolean
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return `<div class="medical-field-value" style="padding: 12px 0; font-size: 0.95rem; line-height: 1.6;">${escape(value)}</div>`;
        }

        // Массив
        if (Array.isArray(value)) {
            return `
                <ul class="medical-list">
                    ${value.map(item => {
                        if (typeof item === 'object' && item !== null) {
                            return `<li><pre style="margin:0; font-size:0.85rem; background:var(--gray-50); padding:8px; border-radius:4px;">${escape(JSON.stringify(item, null, 2))}</pre></li>`;
                        }
                        return `<li>${escape(item)}</li>`;
                    }).join('')}
                </ul>
            `;
        }

        // Объект → таблица
        if (typeof value === 'object') {
            return `
                <table class="medical-table">
                    <tbody>
                    ${Object.entries(value).map(([subKey, subValue]) => {
                        const subLabel = this.toHumanReadable(subKey);
                        let displayValue = '';

                        if (typeof subValue === 'object' && subValue !== null) {
                            displayValue = `<pre style="margin:0; font-size:0.85rem; background:var(--gray-50); padding:8px; border-radius:4px; max-height:180px; overflow:auto;">${escape(JSON.stringify(subValue, null, 2))}</pre>`;
                        } else {
                            displayValue = escape(subValue);
                        }

                        return `<tr><td>${escape(subLabel)}:</td><td>${displayValue}</td></tr>`;
                    }).join('')}
                    </tbody>
                </table>
            `;
        }

        return '';
    }

    renderUniversalCard(key, value) {
        if (value == null) return '';

        const title = this.toHumanReadable(key);
        const iconSvg = `
            <svg class="medical-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
        `;

        const bodyContent = this.renderAnyValue(value);

        return `
            <div class="medical-card">
                <div class="medical-card-header">
                    <div class="medical-card-header-left">
                        ${iconSvg}
                        <h3>${this.escapeHtml(title)}</h3>
                    </div>
                    <svg class="medical-card-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
                <div class="medical-card-body">
                    ${bodyContent}
                </div>
            </div>
        `;
    }

    renderCards(data) {
        if (!this.cardsContainer) return;

        // Обработка OpenAI-формата
        if (data.choices && data.choices[0]?.message?.content) {
            try {
                let content = data.choices[0].message.content;
                content = content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
                data = JSON.parse(content);
            } catch (e) {
                console.warn("Не удалось извлечь JSON из content", e);
            }
        }

        // Временно отключаем transformData для диагностики
        const transformed = data; // this.transformData(data);  ← закомментировано

        if (!transformed || typeof transformed !== 'object') {
            this.cardsContainer.innerHTML = this.renderRawJsonCard(data);
            return;
        }

        const cardsHtml = Object.entries(transformed)
            .map(([key, value]) => this.renderUniversalCard(key, value))
            .filter(Boolean)
            .join('');

        this.cardsContainer.innerHTML = cardsHtml || this.renderRawJsonCard(data);

        // Анимация появления
        const newCards = this.cardsContainer.querySelectorAll('.medical-card');
        newCards.forEach((card, index) => {
            card.style.animation = `slideIn 0.3s ease ${index * 0.05}s both`;
        });
    }

    renderRawJsonCard(data) {
        return `
            <div class="medical-card">
                <div class="medical-card-header">
                    <div class="medical-card-header-left">
                        <svg class="medical-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <h3>Данные (JSON)</h3>
                    </div>
                    <svg class="medical-card-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
                <div class="medical-card-body">
                    <pre style="background: var(--gray-50); padding: 12px; border-radius: var(--radius-sm); overflow-x: auto; font-size: 12px;">${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>
                </div>
            </div>
        `;
    }

    renderField(label, value) {
        if (!value) return '';
        return `
            <div class="medical-field">
                <div class="medical-field-label">${this.escapeHtml(label)}:</div>
                <div class="medical-field-value">${this.escapeHtml(value)}</div>
            </div>
        `;
    }

    renderTableRow(label, value) {
        if (!value) return '';
        return `<tr><td>${this.escapeHtml(label)}:</td><td>${this.escapeHtml(value)}</td></tr>`;
    }

    showLoading() {
        if (this.cardsContainer) {
            this.cardsContainer.innerHTML = `
                <div class="medical-loading">
                    <div class="medical-loading-spinner"></div>
                    <p>Загрузка данных...</p>
                </div>
            `;
        }
    }

    showError(message) {
        if (this.cardsContainer) {
            this.cardsContainer.innerHTML = `
                <div class="medical-error">
                    <strong>Ошибка:</strong> ${this.escapeHtml(message)}
                </div>
            `;
        }
    }

    showEmpty() {
        if (this.cardsContainer) {
            this.cardsContainer.innerHTML = `
                <div class="medical-empty">
                    <p>Нет данных для отображения</p>
                    <p style="font-size: 0.85rem; margin-top: 8px;">Сформируйте структуру, чтобы увидеть данные в удобном формате</p>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getData() {
        return this.currentData;
    }

    exportAsJSON() {
        if (!this.currentData) return null;
        return JSON.stringify(this.currentData, null, 2);
    }

    render(data) {
        this.currentData = data;
        if (!data) {
            this.showEmpty();
            return;
        }
        try {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            this.renderCards(parsedData);
        } catch (error) {
            console.error('Error parsing data:', error);
            this.showError('Ошибка парсинга данных: ' + error.message);
        }
    }
}

// ==================== КОНФИГУРАЦИЯ ====================
const WS_URL = "ws://localhost:8000/ws/audio";
const LLM_URL = "/llm/structure";

// ==================== СОСТОЯНИЕ ====================
let ws = null;
let audioContext = null;
let processor = null;
let globalStream = null;
let recordingTime = 0;
let timerInterval = null;
let animationFrame = null;
let audioAnalyser = null;
let structuredView = null;
let bars = [];

// ==================== DOM ЭЛЕМЕНТЫ ====================
let btnStart, btnStop, btnClear, btnMakeStructured;
let btnCopy, btnCopyTranscript, btnExport;
let statusIndicator, statusText, statusTime, transcriptEl, connectionBadge, visualizationBars;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    // Находим элементы
    btnStart = document.getElementById("btnStart");
    btnStop = document.getElementById("btnStop");
    btnClear = document.getElementById("btnClear");
    btnMakeStructured = document.getElementById("btnMakeStructured");
    btnCopy = document.getElementById("btnCopyStructured");
    btnCopyTranscript = document.getElementById("btnCopyTranscript");
    btnExportPDF = document.getElementById("btnExportPDF");

    statusIndicator = document.getElementById("statusIndicator");
    statusText = document.getElementById("statusText");
    statusTime = document.getElementById("statusTime");
    transcriptEl = document.getElementById("transcript");
    connectionBadge = document.getElementById("connectionBadge");
    visualizationBars = document.getElementById("visualizationBars");

    if (!visualizationBars) {
        console.error("visualizationBars не найден!");
        return;
    }

    // Инициализация StructuredMedicalView
    structuredView = new StructuredMedicalView('structuredViewContainer', {
        onEdit: (label, value) => {
            alert(`Редактирование поля "${label}":\n${value}\n\nФункция редактирования будет добавлена позже.`);
        }
    });

    // Создаём бары визуализации
    for (let i = 0; i < 50; i++) {
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = "5px";
        visualizationBars.appendChild(bar);
        bars.push(bar);
    }

    // Назначаем обработчики
    if (btnStart) btnStart.onclick = startRecording;
    if (btnStop) btnStop.onclick = stopRecording;
    if (btnClear) btnClear.onclick = clearTranscript;
    if (btnMakeStructured) btnMakeStructured.onclick = makeStructured;
    if (btnCopy) {
        btnCopy.onclick = () => {
            const data = structuredView.getData();
            if (data) copyText(JSON.stringify(data, null, 2));
            else alert('Нет данных для копирования');
        };
    }
    if (btnCopyTranscript) {
        btnCopyTranscript.onclick = () => copyText(transcriptEl?.textContent || transcriptEl?.dataset.confirmed || "");
    }
    if (btnExportPDF) {
            btnExportPDF.onclick = () => {
            exportMedicalCard('pdf');
        };
    }
});

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function setStatus(state, message) {
    if (!statusIndicator) return;
    statusIndicator.className = "status-indicator";

    if (state === "recording") {
        statusIndicator.classList.add("recording");
        if (connectionBadge) {
            connectionBadge.textContent = "🎤 Запись";
            connectionBadge.style.background = "var(--danger)";
            connectionBadge.style.color = "white";
        }
    } else if (state === "connected") {
        statusIndicator.classList.add("connected");
        if (connectionBadge) {
            connectionBadge.textContent = "✅ Подключено";
            connectionBadge.style.background = "var(--success)";
            connectionBadge.style.color = "white";
        }
    } else if (state === "processing") {
        statusIndicator.classList.add("processing");
        if (connectionBadge) {
            connectionBadge.textContent = "⚙️ Обработка";
            connectionBadge.style.background = "var(--warning)";
            connectionBadge.style.color = "white";
        }
    } else {
        if (connectionBadge) {
            connectionBadge.textContent = "📡 WebSocket";
            connectionBadge.style.background = "";
            connectionBadge.style.color = "";
        }
    }
    if (statusText) statusText.textContent = message;
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
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function updateTimerDisplay() {
    const mins = Math.floor(recordingTime / 60);
    const secs = recordingTime % 60;
    if (statusTime) statusTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function clearTranscript() {
    if (transcriptEl) {
        transcriptEl.dataset.confirmed = "";
        transcriptEl.textContent = "";
    }
    if (structuredView) structuredView.showEmpty();
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

// ==================== ОСНОВНАЯ ФУНКЦИЯ makeStructured ====================
async function makeStructured() {
    const rawText = (transcriptEl?.textContent || transcriptEl?.dataset.confirmed || "").trim();
    if (!rawText) {
        alert("Сначала запишите речь");
        return;
    }

    // === Защищённый поиск кнопки ===
    const btn = document.getElementById("btnMakeStructured");
    const originalHTML = btn ? btn.innerHTML : '';

    // Блокируем кнопку
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Обработка...`;
    }

    setStatus("processing", "Отправка в LLM...");
    if (structuredView) structuredView.showLoading();

    try {
        const resp = await fetch(LLM_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: rawText })
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        let data = await resp.json();

        console.log("✅ LLM raw response:", data);

        // Поддержка OpenAI-формата
        if (data.choices && data.choices[0]?.message?.content) {
            let content = data.choices[0].message.content;
            content = content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
            try {
                data = JSON.parse(content);
            } catch (e) {
                console.warn("Не удалось распарсить content как JSON");
            }
        }

        // ←←← Главный вызов рендера
        if (structuredView) {
            structuredView.render(data);
        } else {
            console.error("structuredView не инициализирован");
        }

        setStatus("idle", "Структура сформирована");

    } catch (e) {
        console.error("❌ LLM error:", e);
        setStatus("idle", "Ошибка LLM");
        if (structuredView) {
            structuredView.showError(e.message || "Ошибка при обработке ответа");
        }
    } finally {
        // Возвращаем кнопку в исходное состояние — максимально безопасно
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML || `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Сформировать структуру (LLM)
            `;
        }
    }
}

// ==================== WEBSOCKET + АУДИО ФУНКЦИИ ====================
function initWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
        if (transcriptEl) {
            transcriptEl.dataset.confirmed = "";
            transcriptEl.textContent = "";
        }
        setStatus("connected", "WebSocket: подключено");
        ws.send(JSON.stringify({type: 'hello', role: 'client'}));
        console.log("✅ WebSocket connected");
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
        console.log("🔌 WebSocket closed");
    };

    ws.onerror = (error) => {
        setStatus("idle", "WebSocket: ошибка соединения");
        console.error("❌ WebSocket error:", error);
    };
}

function handleServerMessage(msg) {
    if (!msg.type) return;

    if (msg.type === 'partial') {
        if (transcriptEl) {
            transcriptEl.classList.add("partial");
            transcriptEl.textContent = (transcriptEl.dataset.confirmed || "") + " " + msg.text;
        }
    } else if (msg.type === 'final') {
        if (transcriptEl) {
            transcriptEl.classList.remove("partial");
            const confirmed = transcriptEl.dataset.confirmed || "";
            const newConfirmed = (confirmed + " " + msg.text).trim();
            transcriptEl.dataset.confirmed = newConfirmed;
            transcriptEl.textContent = newConfirmed;
        }
    } else if (msg.type === 'info') {
        setStatus("connected", "WS: " + (msg.msg || 'info'));
    } else if (msg.type === 'error') {
        setStatus("idle", "Ошибка: " + (msg.msg || ''));
    }
}

function updateVisualization() {
    if (!audioAnalyser || !animationFrame) return;

    const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
    audioAnalyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const avgVolume = sum / dataArray.length / 256;

    bars.forEach((bar, index) => {
        const position = Math.abs(index - bars.length/2) / (bars.length/2);
        const heightMultiplier = 1 - position * 0.5;
        const height = 5 + (avgVolume * 45 * heightMultiplier);
        bar.style.height = height + 'px';

        if (avgVolume > 0.3) {
            bar.style.background = "var(--primary)";
        } else if (avgVolume > 0.1) {
            bar.style.background = "var(--primary-light)";
        } else {
            bar.style.background = "var(--gray-400)";
        }
    });

    animationFrame = requestAnimationFrame(updateVisualization);
}

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

async function startRecording() {
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = false;
    initWebSocket();
    setStatus("recording", "Запись...");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 1
            }
        });

        globalStream = stream;
        audioContext = new (AudioContext || webkitAudioContext)();

        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 256;

        const source = audioContext.createMediaStreamSource(stream);
        processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(audioAnalyser);
        audioAnalyser.connect(processor);
        processor.connect(audioContext.destination);

        const inputSampleRate = audioContext.sampleRate;

        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        animationFrame = requestAnimationFrame(updateVisualization);

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
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
        console.log("✅ Recording started successfully");

    } catch (err) {
        console.error("❌ Error accessing microphone:", err);
        setStatus("idle", "Ошибка доступа к микрофону");
        if (btnStart) btnStart.disabled = false;
        if (btnStop) btnStop.disabled = true;
    }
}

function stopRecording() {
    if (btnStart) btnStart.disabled = false;
    if (btnStop) btnStop.disabled = true;

    if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
        processor = null;
    }

    if (audioAnalyser) {
        audioAnalyser.disconnect();
        audioAnalyser = null;
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

    bars.forEach(bar => {
        bar.style.height = "5px";
        bar.style.background = "var(--gray-400)";
    });

    console.log("⏹️ Recording stopped");
}
// ==================== ЭКСПОРТ В WORD И PDF ====================

/**
 * Создает HTML для экспорта (общий для Word и PDF)
 */
function generateExportHTML(data) {
    if (!data) return '<p>Нет данных для экспорта</p>';

    // Получаем текущую дату
    const now = new Date();
    const dateStr = now.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Рекурсивная функция для рендеринга данных в HTML
    function renderValue(value, level = 0) {
        if (value === null || value === undefined) return '';

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return `<p style="margin: 0 0 8px 0; line-height: 1.5;">${escapeHtml(String(value))}</p>`;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return '<p><em>Нет данных</em></p>';
            return `
                <ul style="margin: 0 0 12px 0; padding-left: 20px;">
                    ${value.map(item => `<li style="margin-bottom: 6px;">${escapeHtml(String(item))}</li>`).join('')}
                </ul>
            `;
        }

        if (typeof value === 'object') {
            if (Object.keys(value).length === 0) return '<p><em>Нет данных</em></p>';

            return `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                    <tbody>
                        ${Object.entries(value).map(([k, v]) => `
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 8px 12px 8px 0; font-weight: 600; color: #2563eb; width: 30%; vertical-align: top;">
                                    ${escapeHtml(toHumanReadable(k))}:
                                </td>
                                <td style="padding: 8px 0; vertical-align: top;">
                                    ${typeof v === 'object' ? renderValue(v, level + 1) : escapeHtml(String(v))}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        return `<p>${escapeHtml(String(value))}</p>`;
    }

    // Функция для преобразования ключей
    function toHumanReadable(key) {
        const fieldNames = {
            'complaints': 'Жалобы',
            'anamnesis': 'Анамнез заболевания',
            'life_anamnesis': 'Анамнез жизни',
            'status_praesens': 'Объективный статус',
            'recommendations': 'Рекомендации',
            'diagnosis': 'Диагноз',
            'patient_info': 'Информация о пациенте',
            'treatment': 'Назначения',
            'examination': 'Обследование',
            'lab_tests': 'Лабораторные исследования'
        };

        return fieldNames[key] || key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Генерируем HTML для всех карточек
    let cardsHtml = '';
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) continue;

        cardsHtml += `
            <div style="background: white; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb; break-inside: avoid; page-break-inside: avoid;">
                <div style="background: #f9fafb; padding: 16px 20px; border-bottom: 2px solid #2563eb;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                        📋 ${escapeHtml(toHumanReadable(key))}
                    </h3>
                </div>
                <div style="padding: 20px;">
                    ${renderValue(value)}
                </div>
            </div>
        `;
    }

    // Полный HTML документа для экспорта
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Медицинская карта - ${dateStr}</title>
        <style>
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                font-family: 'Segoe UI', 'Roboto', 'Inter', Arial, sans-serif;
                line-height: 1.5;
                color: #1f2937;
                background: white;
                margin: 0;
                padding: 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #2563eb;
            }
            .header h1 {
                margin: 0 0 8px 0;
                color: #2563eb;
                font-size: 24px;
            }
            .header p {
                margin: 0;
                color: #6b7280;
                font-size: 14px;
            }
            .date {
                text-align: right;
                margin-bottom: 20px;
                color: #6b7280;
                font-size: 12px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
            }
            @media print {
                body {
                    padding: 0;
                }
                .no-print {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏥 Медицинская карта пациента</h1>
            <p>VoiceDoc — голосовое заполнение медицинской документации</p>
        </div>

        <div class="date">
            Дата формирования: ${dateStr}
        </div>

        ${cardsHtml || '<p style="text-align: center; color: #6b7280;">Нет данных для отображения</p>'}

        <div class="footer">
            <p>Документ сформирован автоматически с помощью VoiceDoc</p>
            <p>Электронная медицинская карта</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
            <button onclick="window.print()" style="padding: 10px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                🖨️ Печать / Сохранить как PDF
            </button>
            <p style="margin-top: 12px; font-size: 12px; color: #6b7280;">
                Для сохранения в PDF: нажмите "Печать" → выберите "Сохранить как PDF"
            </p>
        </div>

        <script>
            // Автоматически открываем диалог печати, если передан параметр print
            if (window.location.search.includes('print=true')) {
                setTimeout(() => window.print(), 500);
            }
        </script>
    </body>
    </html>`;
}

/**
 * Экспорт в Word (.doc)
 */
function exportToWord(data) {
    if (!data) {
        alert('Нет данных для экспорта');
        return;
    }

    const html = generateExportHTML(data);
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const fileName = `medical_card_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.doc`;

    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus("idle", `Экспортировано в Word: ${fileName}`);
}

/**
 * Экспорт в PDF (открывает окно печати с возможностью сохранения как PDF)
 */
function exportToPDF(data) {
    if (!data) {
        alert('Нет данных для экспорта');
        return;
    }

    const html = generateExportHTML(data);
    const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');

    if (!printWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для этого сайта');
        return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Ждем загрузки содержимого, затем открываем печать
    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
            setStatus("idle", "Открыто окно печати. Выберите 'Сохранить как PDF' для экспорта");
        }, 500);
    };
}

/**
 * Универсальный экспорт с выбором формата
 */
function exportMedicalCard(format = 'pdf') {
    const data = structuredView.getData();

    if (!data) {
        alert('Нет данных для экспорта. Сначала сформируйте структуру.');
        return;
    }

    // Обрабатываем данные, если они в формате OpenAI
    let exportData = data;
    if (data.choices && data.choices[0]?.message?.content) {
        try {
            let content = data.choices[0].message.content;
            content = content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
            exportData = JSON.parse(content);
        } catch (e) {
            console.warn("Не удалось распарсить content как JSON");
        }
    }

    if (format === 'word') {
        exportToWord(exportData);
    } else {
        exportToPDF(exportData);
    }
}

console.log("VoiceDoc загружен");