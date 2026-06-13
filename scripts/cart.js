"use strict";

/**
 * Страница корзины: список добавленного мерча с количеством и стоимостью.
 * Данные берутся из localStorage через window.Cart.
 */
document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("cart-list");
  if (!list || !window.Cart) return;

  const esc = (s) => s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const items = window.Cart.items().filter((i) => i.product);

  if (!items.length) {
    list.innerHTML = `<p class="cart-empty">Корзина пуста. Загляните в раздел «Мерч» на главной.</p>`;
    return;
  }

  list.innerHTML = items.map((i) => `
    <article class="cart-item">
      <div class="cart-item__img"><img src="${i.product.img}" alt="${esc(i.name)}"></div>
      <div class="cart-item__info">
        <span class="cart-item__name">${esc(i.name)} (${esc(i.product.volume)})</span>
        <span class="cart-item__unit">${i.product.price}₽ за штуку</span>
      </div>
      <span class="cart-item__count">× ${i.count}</span>
      <span class="cart-item__sum">${i.product.price * i.count}₽</span>
    </article>`).join("") +
    `<div class="cart-total">Итого: <b>${window.Cart.total()}₽</b></div>`;
});
