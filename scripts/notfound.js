"use strict";

/**
 * Страница 404. Нижняя подпись выбирается случайно при каждом заходе
 * и при этом не повторяет подпись с предыдущего показа (хранится в sessionStorage).
 */
document.addEventListener("DOMContentLoaded", () => {
  const MESSAGES = [
    "Кажется ваше подключение к сети улетело",
    "Страница пропала в бермудском треугольнике",
    "Спасибо что включили авиарежим",
  ];

  const el = document.getElementById("e404-msg");
  if (!el) return;

  const KEY = "openwing:404msg";
  let prev = -1;
  try { prev = Number(sessionStorage.getItem(KEY)); } catch (_) {}

  let idx = Math.floor(Math.random() * MESSAGES.length);
  if (MESSAGES.length > 1 && idx === prev) {
    idx = (idx + 1) % MESSAGES.length;
  }

  el.textContent = MESSAGES[idx];
  try { sessionStorage.setItem(KEY, String(idx)); } catch (_) {}
});
