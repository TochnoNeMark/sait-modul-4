"use strict";

/**
 * Форма записи на курс (страница enroll.html, дизайн div 3.1).
 * Нефункциональная: ничего не отправляет. При «отправить» форма
 * сбрасывается, после чего происходит возврат на главную страницу.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("enroll-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Редирект на главную сам очищает состояние формы — отдельный reset не нужен.
    window.location.href = "index.html";
  });
});
