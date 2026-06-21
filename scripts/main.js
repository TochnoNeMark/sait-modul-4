"use strict";

/**
 * Общий скрипт сайта OpenWing (многостраничная версия).
 *  - подсветка активного раздела в навигации по текущей странице;
 *  - клик по городу на главной сохраняет выбор и ведёт на страницу билетов,
 *    где «Куда» заполняется автоматически (booking.js читает sessionStorage);
 *  - кнопка «домой» на главной прокручивает вверх, на остальных ведёт на главную;
 *  - бургер-меню для мобильной навигации.
 */
document.addEventListener("DOMContentLoaded", () => {
  /* ---- Активный раздел по текущей странице ---- */
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const PAGE_BY_FILE = {
    "": "index", "index.html": "index",
    "tickets.html": "tickets",
    "events.html": "events", "enroll.html": "events",
    "reviews.html": "reviews",
    "merch.html": "merch", "product.html": "merch",
  };
  const activePage = PAGE_BY_FILE[file];
  if (activePage) {
    document.querySelectorAll(".nav__btn").forEach((btn) =>
      btn.classList.toggle("is-active", btn.dataset.page === activePage));
  }

  /* ---- Выбор города на главной -> страница билетов ---- */
  document.querySelectorAll(".city[data-city]").forEach((link) => {
    link.addEventListener("click", () => {
      try { sessionStorage.setItem("openwing:destination", link.dataset.city); } catch (_) {}
      // переход выполнит сам href="tickets.html"
    });
  });

  /* ---- Кнопка «домой» ---- */
  const homeBtn = document.getElementById("home-btn");
  if (homeBtn && (file === "" || file === "index.html")) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    nav.querySelectorAll(".nav__btn").forEach((b) => b.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }
});
