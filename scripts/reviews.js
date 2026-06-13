"use strict";

/**
 * Отзывы — div 4. Отзывы хранятся только в памяти (в DOM) и стираются
 * при перезагрузке страницы — намеренно, без localStorage.
 *  - форма над рамкой: имя + оценка (звёзды) + текст -> «Отправить»
 *    добавляет карточку в ленту и очищает форму;
 *  - каждые 30 секунд нахождения на странице генерируется случайный
 *    отзыв (случайные имя, текст и оценка);
 *  - прокрутка внутри рамки не прокручивает страницу
 *    (overscroll-behavior: contain в CSS).
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("review-form");
  const pool = document.getElementById("reviews-pool");
  const ratingInput = document.getElementById("rating-input");
  if (!form || !pool || !ratingInput) return;

  const AVATAR = "assets/images/div4/avatar.webp";

  /* ---- Данные для автогенерации ---- */
  const NAMES = [
    "Алексей", "Мария", "Дмитрий", "Екатерина", "Сергей", "Анна",
    "Иван", "Ольга", "Павел", "Наталья", "Андрей", "Виктория",
    "Михаил", "Юлия", "Роман", "Светлана", "Captain_Jack", "skywalker_99",
    "aviator_pro", "Елена", "Никита", "cloud_rider", "Татьяна", "Артём",
  ];
  const TEXTS = [
    "Потрясающе! Лучшая авиакомпания!!!",
    "Долетел быстро и с комфортом, спасибо!",
    "Цены приятно удивили, рекомендую.",
    "Вежливый персонал, всё понравилось.",
    "Самолёты новые, перелёт прошёл гладко.",
    "Регистрация заняла пару минут, удобно.",
    "Немного задержали вылет, но в целом хорошо.",
    "Отличный сервис на борту, вернусь ещё.",
    "Купил билет за 100 рублей — не поверил, но всё честно!",
    "Багаж не потеряли, прилетел вовремя.",
    "Уютный салон и приятная атмосфера.",
    "Бронирование через сайт — проще некуда.",
    "Летал в Тау Кита, обслуживание на высоте!",
    "Программа OpenWing+ реально экономит деньги.",
    "Всё чётко, без лишней суеты. Молодцы!",
  ];

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  /* ---- Звёзды ---- */
  const STAR_PATH =
    "M12 2l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.02 6.09 20.16l1.13-6.57L2.45 8.94l6.6-.96L12 2z";

  const starSVG = (filled) =>
    `<svg viewBox="0 0 24 24" class="star ${filled ? "is-on" : ""}" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;

  const renderStars = (value) => {
    let html = "";
    for (let i = 1; i <= 5; i++) html += starSVG(i <= value);
    return html;
  };

  /* ---- Интерактивный рейтинг в форме ---- */
  let currentRating = 0;
  const buildRatingInput = () => {
    ratingInput.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "star-btn";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-label", `${i} из 5`);
      btn.dataset.value = i;
      btn.innerHTML = starSVG(false);
      btn.addEventListener("click", () => setRating(i));
      btn.addEventListener("mouseenter", () => paintStars(i));
      ratingInput.appendChild(btn);
    }
    ratingInput.addEventListener("mouseleave", () => paintStars(currentRating));
  };
  const paintStars = (value) => {
    ratingInput.querySelectorAll(".star").forEach((s, i) =>
      s.classList.toggle("is-on", i < value));
  };
  const setRating = (value) => {
    currentRating = value;
    paintStars(value);
    ratingInput.querySelectorAll(".star-btn").forEach((b, i) =>
      b.setAttribute("aria-checked", String(i + 1 === value)));
  };

  /* ---- Создание карточки отзыва ---- */
  const addReview = ({ name, text, rating }, prepend = true) => {
    const card = document.createElement("article");
    card.className = "review-card";
    card.innerHTML = `
      <span class="review__avatar"><img src="${AVATAR}" alt=""></span>
      <div class="review-card__body">
        <div class="review-card__head">
          <span class="review-card__name">${escapeHTML(name)}</span>
          <span class="rating">${renderStars(rating)}</span>
        </div>
        <p class="review-card__text">${escapeHTML(text)}</p>
      </div>`;
    if (prepend) pool.prepend(card);
    else pool.append(card);
  };

  const escapeHTML = (s) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---- Отправка формы ---- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const text = form.text.value.trim();
    if (!name || !text) return;
    const rating = currentRating || 5; // если не выбрана — ставим 5
    addReview({ name, text, rating }, true);
    form.reset();
    setRating(0);
    pool.scrollTop = 0;
  });

  /* ---- Автогенерация каждые 30 секунд ---- */
  const generateRandom = () =>
    addReview({ name: rand(NAMES), text: rand(TEXTS), rating: randInt(3, 5) }, false);

  setInterval(generateRandom, 30000);

  /* ---- Инициализация: несколько стартовых отзывов ---- */
  buildRatingInput();
  for (let i = 0; i < 3; i++) generateRandom();
});
