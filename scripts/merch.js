"use strict";

/**
 * Генерация карточек мерча (div 5) из каталога window.PRODUCTS.
 * Кнопка «В корзину» добавляет товар в корзину, «Подробнее» ведёт на
 * страницу товара product.html?id=<id>. Карточки не прокручиваются —
 * выводятся сеткой целиком.
 */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("merch-grid");
  if (!grid || !window.PRODUCTS) return;

  const esc = (s) => s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  grid.innerHTML = window.PRODUCTS.map((p) => `
    <article class="merch-card">
      <div class="merch-card__head">${esc(p.name)} (${esc(p.volume)}) ${p.price}₽</div>
      <div class="merch-card__body">
        <div class="merch-card__img"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></div>
        <p class="merch-card__desc">${esc(p.desc)}</p>
      </div>
      <div class="merch-card__foot">
        <button type="button" class="merch-card__add" data-add="${esc(p.name)}">В корзину</button>
        <a class="merch-card__more" href="product.html?id=${encodeURIComponent(p.id)}">Подробнее</a>
      </div>
    </article>`).join("");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    window.Cart.add(btn.dataset.add);
    // короткая визуальная отметка
    btn.classList.add("is-added");
    btn.textContent = "Добавлено ✓";
    setTimeout(() => { btn.classList.remove("is-added"); btn.textContent = "В корзину"; }, 1200);
  });
});
