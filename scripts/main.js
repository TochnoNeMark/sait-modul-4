"use strict";

/**
 * Главный скрипт сайта OpenWing.
 * - скролл-спай активного раздела в навигации;
 * - плавная прокрутка по якорям с учётом высоты шапки;
 * - выбор города в div 1 -> прокрутка к форме билетов (div 2)
 *   + автоподстановка значения в поле «Куда» (forward-compatible:
 *   поле появится позже, обработчик уже готов);
 * - кнопка «домой» возвращает в начало главной;
 * - бургер-меню для мобильной навигации.
 */
document.addEventListener("DOMContentLoaded", () => {
  const navButtons = Array.from(document.querySelectorAll(".nav__btn"));
  const sections = navButtons
    .map((btn) => document.getElementById(btn.dataset.target))
    .filter(Boolean);

  /* ---- Скролл-спай: подсветка активного раздела ---- */
  if (sections.length && "IntersectionObserver" in window) {
    const setActive = (id) => {
      navButtons.forEach((btn) =>
        btn.classList.toggle("is-active", btn.dataset.target === id)
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---- Выбор города -> форма билетов ---- */
  const DEST_KEY = "openwing:destination";

  const fillDestination = (city) => {
    // Поле появится в div 2 (любой из вариантов id/имени) — заполняем, если есть.
    const field = document.querySelector(
      '#dest-input, [name="destination"], [data-field="destination"]'
    );
    if (field) {
      field.value = city;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  document.querySelectorAll(".city[data-city]").forEach((link) => {
    link.addEventListener("click", () => {
      const city = link.dataset.city;
      // Сохраняем выбор: если поле ещё не существует, оно подхватит значение при инициализации.
      try { sessionStorage.setItem(DEST_KEY, city); } catch (_) {}
      fillDestination(city);
    });
  });

  // Если поле «Куда» уже есть на странице — восстановим ранее выбранный город.
  try {
    const saved = sessionStorage.getItem(DEST_KEY);
    if (saved) fillDestination(saved);
  } catch (_) {}

  /* ---- Кнопка «домой»: в начало главной ---- */
  const homeBtn = document.getElementById("home-btn");
  if (homeBtn && /(^|\/)index\.html?$|\/$/.test(location.pathname)) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", location.pathname);
    });
  }

  /* ---- Поиск (заглушка) ---- */
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      // Реализация поиска запланирована позже.
    });
  }

  /* ---- Бургер-меню ---- */
  const burger = document.getElementById("burger");
  const nav = document.querySelector(".nav");
  const overlay = document.getElementById("nav-overlay");

  const closeMenu = () => {
    burger?.classList.remove("is-open");
    nav?.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    burger?.setAttribute("aria-expanded", "false");
  };

  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      overlay?.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    overlay?.addEventListener("click", closeMenu);
    nav.querySelectorAll(".nav__btn").forEach((b) =>
      b.addEventListener("click", closeMenu)
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }
});
