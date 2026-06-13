"use strict";

/**
 * Переиспользуемый движок отзывов (div 4 на главной и div 5.2 на странице
 * товара работают одинаково). Отзывы хранятся только в DOM и стираются при
 * перезагрузке — намеренно, без localStorage.
 *  - форма: имя + оценка звёздами + текст -> добавляет карточку наверх ленты;
 *  - каждые 30 секунд генерируется случайный отзыв (имя/текст/оценка);
 *  - прокрутка ленты передаётся странице только на верхней/нижней границе.
 * Набор текстов выбирается по data-reviews="site" | "merch" на форме.
 */
(function () {
  const NAMES = [
    "Алексей", "Мария", "Дмитрий", "Екатерина", "Сергей", "Анна", "Иван",
    "Ольга", "Павел", "Наталья", "Андрей", "Виктория", "Михаил", "Юлия",
    "Роман", "Светлана", "Captain_Jack", "skywalker_99", "aviator_pro",
    "Елена", "Никита", "cloud_rider", "Татьяна", "Артём",
  ];
  const TEXTS = {
    site: [
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
      "Бронирование через сайт — проще некуда.",
      "Программа OpenWing+ реально экономит деньги.",
    ],
    merch: [
      "Отличный чемодан, очень вместительный!",
      "Качество на высоте, колёсики едут плавно.",
      "Прочный корпус, не поцарапался за поездку.",
      "За такие деньги — просто находка.",
      "Лёгкий и удобный, рекомендую.",
      "Замок надёжный, ручка не люфтит.",
      "Пережил три перелёта без единой царапины.",
      "Цвет насыщенный, выглядит дорого.",
      "Доставили на следующий день, как и обещали.",
      "Беру уже второй, очень доволен.",
      "Вместил всё необходимое и ещё осталось место.",
      "Лучшая покупка перед отпуском!",
    ],
  };

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const escapeHTML = (s) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const STAR_PATH =
    "M12 2l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.02 6.09 20.16l1.13-6.57L2.45 8.94l6.6-.96L12 2z";
  const starSVG = (filled) =>
    `<svg viewBox="0 0 24 24" class="star ${filled ? "is-on" : ""}" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
  const renderStars = (value) => {
    let html = "";
    for (let i = 1; i <= 5; i++) html += starSVG(i <= value);
    return html;
  };

  function initReviews(form) {
    const section = form.closest(".section--reviews, .reviews-block") || document;
    const pool = section.querySelector("[data-reviews-pool]");
    const ratingInput = section.querySelector("[data-rating-input]");
    if (!pool || !ratingInput) return;

    const kind = form.dataset.reviews === "merch" ? "merch" : "site";
    const avatar = form.dataset.avatar || "assets/images/div4/avatar.webp";
    const texts = TEXTS[kind];

    /* Интерактивный рейтинг */
    let currentRating = 0;
    const paintStars = (value) =>
      ratingInput.querySelectorAll(".star").forEach((s, i) => s.classList.toggle("is-on", i < value));
    const setRating = (value) => {
      currentRating = value;
      paintStars(value);
      ratingInput.querySelectorAll(".star-btn").forEach((b, i) =>
        b.setAttribute("aria-checked", String(i + 1 === value)));
    };
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

    /* Карточка отзыва */
    const addReview = ({ name, text, rating }) => {
      const card = document.createElement("article");
      card.className = "review-card";
      card.innerHTML = `
        <span class="review__avatar"><img src="${avatar}" alt=""></span>
        <div class="review-card__body">
          <div class="review-card__head">
            <span class="review-card__name">${escapeHTML(name)}</span>
            <span class="rating">${renderStars(rating)}</span>
          </div>
          <p class="review-card__text">${escapeHTML(text)}</p>
        </div>`;
      pool.prepend(card);
    };

    /* Отправка формы */
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const text = form.elements.text.value.trim();
      if (!name || !text) return;
      addReview({ name, text, rating: currentRating || 5 });
      form.reset();
      setRating(0);
      pool.scrollTop = 0;
    });

    /* Автогенерация */
    const generateRandom = () =>
      addReview({ name: rand(NAMES), text: rand(texts), rating: randInt(3, 5) });
    setInterval(generateRandom, 30000);

    /* Стартовые отзывы */
    for (let i = 0; i < 3; i++) generateRandom();
  }

  window.initReviews = initReviews;

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("form[data-reviews]").forEach(initReviews);
  });
})();
