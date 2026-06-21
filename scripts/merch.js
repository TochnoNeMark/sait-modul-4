"use strict";

/**
 * Раздел «Мерч» (div 1.5): сетка карточек из каталога с переключением
 * категорий (Чемоданы / Подушки / Электроника). Корзина общая для всех
 * категорий. «в корзину» добавляет товар цвета «обычный» (выбор цвета —
 * на странице товара), «Подробнее» ведёт на product.html?id=<id>.
 */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("merch-grid");
  const catsBox = document.getElementById("merch-cats");
  if (!grid || !window.PRODUCTS) return;

  const esc = (s) => s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const CATEGORIES = window.CATEGORIES || [{ key: "suitcase", label: "Чемоданы" }];
  let active = CATEGORIES[0].key;

  // Кнопки категорий (рендерим из каталога, если есть контейнер)
  if (catsBox) {
    catsBox.innerHTML = CATEGORIES.map((c) =>
      `<button type="button" class="merch-cat ${c.key === active ? "is-active" : ""}" data-cat="${c.key}">${esc(c.label)}</button>`).join("");
    catsBox.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      active = btn.dataset.cat;
      catsBox.querySelectorAll(".merch-cat").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderGrid();
    });
  }

  function renderGrid() {
    const items = window.PRODUCTS.filter((p) => (p.category || "suitcase") === active);
    grid.innerHTML = items.map((p) => `
      <article class="merch-card">
        <div class="merch-card__head">${esc(p.name)} (${esc(p.volume)}) ${p.price}₽</div>
        <div class="merch-card__body">
          <div class="merch-card__img"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></div>
          <p class="merch-card__desc">${esc(p.desc)}</p>
        </div>
        <div class="merch-card__foot">
          <button type="button" class="merch-card__add" data-id="${esc(p.id)}">в корзину</button>
          <a class="merch-card__more" href="product.html?id=${encodeURIComponent(p.id)}">Подробнее</a>
        </div>
      </article>`).join("");
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id]");
    if (!btn) return;
    window.Cart.add(btn.dataset.id, "none");
    btn.classList.add("is-added");
    btn.textContent = "Добавлено ✓";
    setTimeout(() => { btn.classList.remove("is-added"); btn.textContent = "в корзину"; }, 1200);
  });

  renderGrid();
});
