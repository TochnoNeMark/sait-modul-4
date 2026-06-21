"use strict";

/**
 * Страница корзины: список позиций с учётом цвета, количеством, ценой и
 * итогом. Можно менять количество (− / +) и удалять позицию. Все изменения
 * сразу отражаются в localStorage и в кнопке «Корзина» в шапке.
 */
document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("cart-list");
  if (!list || !window.Cart) return;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function render() {
    const items = window.Cart.items();

    if (!items.length) {
      list.innerHTML = `<p class="cart-empty">Корзина пуста. Загляните в раздел «Мерч».</p>`;
      return;
    }

    list.innerHTML = items.map((i) => `
      <article class="cart-item" data-line="${esc(i.key)}">
        <span class="cart-item__img product__image" data-tint="${esc(i.colorKey)}">
          <img src="${i.product.img}" alt="${esc(i.product.name)}">
          <span class="product__tint"></span>
        </span>
        <div class="cart-item__info">
          <span class="cart-item__name">${esc(i.product.name)} (${esc(i.product.volume)})</span>
          <span class="cart-item__color">Цвет: ${esc(i.color.label)}</span>
          <span class="cart-item__unit">${i.product.price}₽ за штуку</span>
        </div>
        <div class="cart-item__qty" role="group" aria-label="Количество">
          <button type="button" class="cart-qty" data-act="dec" aria-label="Уменьшить">−</button>
          <span class="cart-item__count">${i.count}</span>
          <button type="button" class="cart-qty" data-act="inc" aria-label="Увеличить">+</button>
        </div>
        <span class="cart-item__sum">${i.product.price * i.count}₽</span>
        <button type="button" class="cart-item__remove" data-act="remove" aria-label="Удалить позицию">Удалить</button>
      </article>`).join("") +
      `<div class="cart-total">Итого: <b>${window.Cart.total()}₽</b></div>`;
  }

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const row = btn.closest(".cart-item");
    const key = row.dataset.line;
    const count = window.Cart.items().find((i) => i.key === key)?.count || 0;

    if (btn.dataset.act === "inc") window.Cart.setCount(key, count + 1);
    else if (btn.dataset.act === "dec") window.Cart.setCount(key, count - 1);
    else if (btn.dataset.act === "remove") window.Cart.remove(key);

    render();
  });

  render();
});
