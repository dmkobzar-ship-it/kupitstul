"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Bug,
  Mic,
  MicOff,
  Send,
  Trash2,
  List,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
} from "lucide-react";

// Типы для Web Speech API
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface Feedback {
  id: string;
  element: string;
  selector: string;
  comment: string;
  timestamp: Date;
  pageUrl: string;
  resolved: boolean;
}

// Функция для получения уникального CSS селектора элемента
function getSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === "string") {
      const classes = current.className
        .split(" ")
        .filter((c) => c && !c.startsWith("hover:") && !c.includes(":"));
      if (classes.length > 0) {
        selector += "." + classes.slice(0, 2).join(".");
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.slice(-3).join(" > ");
}

// Функция для получения текстового описания элемента
function getElementDescription(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  const text = element.textContent?.slice(0, 50) || "";
  const className = element.className?.toString().slice(0, 30) || "";

  if (text) {
    return `<${tag}> "${text}${text.length >= 50 ? "..." : ""}"`;
  }
  if (className) {
    return `<${tag} class="${className}...">`;
  }
  return `<${tag}>`;
}

export default function FeedbackWidget() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  // Загрузка сохранённых замечаний через lazy initialization
  const [feedbacksLoaded, setFeedbacksLoaded] = useState(false);

  // Инициализация из localStorage при первом рендере
  useEffect(() => {
    if (typeof window !== "undefined" && !feedbacksLoaded) {
      const saved = localStorage.getItem("dev-feedbacks");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // eslint-disable-next-line react-compiler/react-compiler
          setFeedbacks(
            parsed.map((f: Feedback) => ({
              ...f,
              timestamp: new Date(f.timestamp),
            }))
          );
        } catch (e) {
          console.error("Error loading feedbacks:", e);
        }
      }
      setFeedbacksLoaded(true);
    }
  }, [feedbacksLoaded]);

  // Сохранение замечаний в localStorage
  useEffect(() => {
    if (feedbacksLoaded) {
      if (feedbacks.length > 0) {
        localStorage.setItem("dev-feedbacks", JSON.stringify(feedbacks));
      } else {
        localStorage.removeItem("dev-feedbacks");
      }
    }
  }, [feedbacks, feedbacksLoaded]);

  // Инициализация распознавания речи
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "ru-RU";
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setComment((prev) => prev + " " + transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Функция для очистки подсветки
  const clearHighlight = useCallback(() => {
    if (hoveredElementRef.current) {
      hoveredElementRef.current.style.outline = "";
      hoveredElementRef.current.style.outlineOffset = "";
      hoveredElementRef.current = null;
    }
  }, []);

  // Функция для подсветки элемента
  const highlightElement = useCallback(
    (element: HTMLElement) => {
      clearHighlight();
      hoveredElementRef.current = element;
      element.style.outline = "3px solid #f97316";
      element.style.outlineOffset = "2px";
    },
    [clearHighlight]
  );

  // Обработчик наведения мыши
  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      if (!isEnabled || showForm) return;

      const target = e.target as HTMLElement;
      if (target.closest("[data-feedback-widget]")) return;

      highlightElement(target);
    },
    [isEnabled, showForm, highlightElement]
  );

  // Обработчик ухода мыши
  const handleMouseOut = useCallback(() => {
    if (!isEnabled || showForm) return;
    clearHighlight();
  }, [isEnabled, showForm, clearHighlight]);

  // Обработчик клика
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!isEnabled) return;

      const target = e.target as HTMLElement;
      if (target.closest("[data-feedback-widget]")) return;

      e.preventDefault();
      e.stopPropagation();

      setSelectedElement(target);
      setShowForm(true);
      clearHighlight();
    },
    [isEnabled, clearHighlight]
  );

  // Подключение/отключение обработчиков
  useEffect(() => {
    if (isEnabled) {
      document.addEventListener("mouseover", handleMouseOver, true);
      document.addEventListener("mouseout", handleMouseOut, true);
      document.addEventListener("click", handleClick, true);
      document.body.style.cursor = "crosshair";
    } else {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.removeEventListener("click", handleClick, true);
      document.body.style.cursor = "";
      clearHighlight();
    }

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.removeEventListener("click", handleClick, true);
      document.body.style.cursor = "";
      clearHighlight();
    };
  }, [isEnabled, handleMouseOver, handleMouseOut, handleClick, clearHighlight]);

  // Запись голоса
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Распознавание речи не поддерживается в вашем браузере");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Отправка замечания
  const submitFeedback = () => {
    if (!selectedElement || !comment.trim()) return;

    const newFeedback: Feedback = {
      id: Date.now().toString(),
      element: getElementDescription(selectedElement),
      selector: getSelector(selectedElement),
      comment: comment.trim(),
      timestamp: new Date(),
      pageUrl: window.location.pathname,
      resolved: false,
    };

    setFeedbacks((prev) => [...prev, newFeedback]);

    // Вывод в консоль для разработчика
    console.log(
      "%c📝 Новое замечание:",
      "color: #f97316; font-weight: bold; font-size: 14px;"
    );
    console.log("Элемент:", newFeedback.element);
    console.log("Селектор:", newFeedback.selector);
    console.log("Комментарий:", newFeedback.comment);
    console.log("Страница:", newFeedback.pageUrl);
    console.log("---");

    // Закрываем форму
    setShowForm(false);
    setSelectedElement(null);
    setComment("");

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Закрытие формы
  const closeForm = () => {
    setShowForm(false);
    setSelectedElement(null);
    setComment("");
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Удаление замечания
  const deleteFeedback = (id: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
  };

  // Переключение статуса
  const toggleResolved = (id: string) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolved: !f.resolved } : f))
    );
  };

  // Копирование всех замечаний
  const copyAllFeedbacks = () => {
    const text = feedbacks
      .map(
        (f) =>
          `[${f.resolved ? "✓" : "○"}] ${f.pageUrl}\n   Элемент: ${f.element}\n   Селектор: ${f.selector}\n   Замечание: ${f.comment}\n`
      )
      .join("\n");

    navigator.clipboard.writeText(text);
    alert("Замечания скопированы в буфер обмена!");
  };

  // 🚀 Отправка замечаний в Copilot Chat (копирует в буфер + сохраняет в файл)
  const sendToCopilot = async () => {
    const unresolved = feedbacks.filter((f) => !f.resolved);

    if (unresolved.length === 0) {
      alert("Нет неисправленных замечаний для отправки!");
      return;
    }

    // Форматируем для Copilot Chat
    const copilotMessage = `## 🐛 Замечания по сайту КупитьСтул

Всего замечаний: ${unresolved.length}

${unresolved
  .map(
    (f, i) => `### ${i + 1}. ${f.comment}
- **Страница:** ${f.pageUrl}
- **Элемент:** \`${f.element}\`
- **Селектор:** \`${f.selector}\`
`
  )
  .join("\n")}

---
Пожалуйста, исправь эти замечания!`;

    // Копируем в буфер
    await navigator.clipboard.writeText(copilotMessage);

    // Сохраняем в файл через API (для чтения Copilot)
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbacks: unresolved }),
      });
    } catch (e) {
      console.log("API not available, using clipboard only");
    }

    alert(`✅ ${unresolved.length} замечаний скопировано в буфер!`);
  };

  // Очистка всех замечаний
  const clearAllFeedbacks = () => {
    if (confirm("Удалить все замечания?")) {
      setFeedbacks([]);
      localStorage.removeItem("dev-feedbacks");
    }
  };

  // Не рендерим в production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const unresolvedCount = feedbacks.filter((f) => !f.resolved).length;

  return (
    <div data-feedback-widget="true">
      {/* Плавающая кнопка */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
        {/* Кнопка списка замечаний */}
        {feedbacks.length > 0 && (
          <button
            onClick={() => setIsListOpen(!isListOpen)}
            className={`p-3 rounded-full shadow-lg transition-all ${
              isListOpen
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="Список замечаний"
          >
            <List className="w-5 h-5" />
            {unresolvedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unresolvedCount}
              </span>
            )}
          </button>
        )}

        {/* Основная кнопка */}
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`p-4 rounded-full shadow-lg transition-all ${
            isEnabled
              ? "bg-orange-500 text-white scale-110"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title={
            isEnabled ? "Выключить режим замечаний" : "Включить режим замечаний"
          }
        >
          {isEnabled ? (
            <EyeOff className="w-6 h-6" />
          ) : (
            <Bug className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Индикатор режима */}
      {isEnabled && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">
            Режим замечаний: кликните на элемент
          </span>
        </div>
      )}

      {/* Форма добавления замечания */}
      {showForm && selectedElement && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div
            ref={formRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            data-feedback-widget="true"
          >
            {/* Заголовок */}
            <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold">Добавить замечание</h3>
              <button
                onClick={closeForm}
                className="p-1 hover:bg-orange-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Информация об элементе */}
            <div className="px-4 py-3 bg-gray-50 border-b">
              <p className="text-xs text-gray-500 mb-1">Выбранный элемент:</p>
              <code className="text-sm text-orange-600 break-all">
                {getElementDescription(selectedElement)}
              </code>
              <p className="text-xs text-gray-400 mt-1 break-all">
                {getSelector(selectedElement)}
              </p>
            </div>

            {/* Поле ввода */}
            <div className="p-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (comment.trim()) {
                      submitFeedback();
                    }
                  }
                }}
                placeholder="Опишите, что нужно исправить... (Ctrl+Enter для отправки)"
                className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
                autoFocus
              />

              {/* Кнопки */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  title={isRecording ? "Остановить запись" : "Надиктовать"}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1" />

                <button
                  onClick={closeForm}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Отмена
                </button>

                <button
                  onClick={submitFeedback}
                  disabled={!comment.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Отправить
                </button>
              </div>

              {isRecording && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Идёт запись... Говорите
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Список замечаний */}
      {isListOpen && (
        <div className="fixed bottom-20 right-4 z-[9998] w-96 max-h-[60vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Заголовок */}
          <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold">Замечания ({feedbacks.length})</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={sendToCopilot}
                className="p-1.5 hover:bg-purple-600 bg-purple-500 rounded"
                title="🚀 Отправить в Copilot Chat"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={copyAllFeedbacks}
                className="p-1.5 hover:bg-gray-700 rounded"
                title="Копировать все"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={clearAllFeedbacks}
                className="p-1.5 hover:bg-gray-700 rounded text-red-400"
                title="Очистить все"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsListOpen(false)}
                className="p-1.5 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Кнопка отправки в Copilot */}
          {feedbacks.filter((f) => !f.resolved).length > 0 && (
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500">
              <button
                onClick={sendToCopilot}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Отправить {feedbacks.filter((f) => !f.resolved).length}{" "}
                замечаний в Copilot
              </button>
            </div>
          )}

          {/* Список */}
          <div className="flex-1 overflow-y-auto">
            {feedbacks.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bug className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Замечаний пока нет</p>
              </div>
            ) : (
              <div className="divide-y">
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className={`p-3 ${feedback.resolved ? "bg-green-50" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleResolved(feedback.id)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          feedback.resolved
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {feedback.resolved && "✓"}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${feedback.resolved ? "line-through text-gray-400" : "text-gray-900"}`}
                        >
                          {feedback.comment}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {feedback.pageUrl} • {feedback.element}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteFeedback(feedback.id)}
                        className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Расширение типов для Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}
