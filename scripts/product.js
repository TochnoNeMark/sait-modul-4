"use strict";

/**
 * Рендер страницы товара (div 1.5.1) из каталога по параметру ?id=.
 * Один шаблон product.html обслуживает все товары.
 *  - выбор цвета (обычный / красный / синий / зелёный) меняет подпись
 *    и тонирует главное изображение;
 *  - «в корзину» добавляет товар с учётом выбранного цвета;
 *  - «Назад» возвращает к разделу «Мерч» (ссылка в HTML).
 */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("product");
  if (!root || !window.PRODUCTS) return;

  const id = new URLSearchParams(location.search).get("id");
  const product = window.getProduct(id) || window.PRODUCTS[0];

  document.title = `${product.name} — OpenWing`;

  const imgEl = document.getElementById("product-img");
  const imgWrap = document.querySelector(".product__left .product__image");
  imgEl.src = product.img;
  imgEl.alt = product.name;
  document.getElementById("product-title").textContent =
    `${product.name} (${product.volumeFull})`;
  document.getElementById("product-desc").textContent = product.desc;
  document.getElementById("product-price").textContent = `${product.price} ₽`;

  /* Рейтинг (статичный, из каталога) */
  const STAR_PATH =
    "M12 2l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.02 6.09 20.16l1.13-6.57L2.45 8.94l6.6-.96L12 2z";
  let stars = "";
  for (let i = 1; i <= 5; i++)
    stars += `<svg viewBox="0 0 24 24" class="star ${i <= product.rating ? "is-on" : ""}" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
  document.getElementById("product-stars").innerHTML = stars;

  /* Выбор цвета (источник — каталог) */
  const COLORS = window.COLORS;
  let selectedColor = "none";
  const swatches = document.getElementById("product-swatches");
  const colorLabel = document.getElementById("product-color");

  swatches.innerHTML = COLORS.map((c, i) => `
    <button type="button" class="swatch ${i === 0 ? "is-active" : ""}" data-tint="${c.key}" aria-label="Цвет: ${c.label}">
      <span class="product__image" data-tint="${c.key}">
        <img src="${product.img}" alt="">
        <span class="product__tint"></span>
      </span>
    </button>`).join("");

  swatches.addEventListener("click", (e) => {
    const btn = e.target.closest(".swatch");
    if (!btn) return;
    selectedColor = btn.dataset.tint;
    imgWrap.dataset.tint = selectedColor;
    colorLabel.textContent = "Цвет: " + window.getColor(selectedColor).label;
    swatches.querySelectorAll(".swatch").forEach((s) =>
      s.classList.toggle("is-active", s === btn));
  });

  /* В корзину — с учётом выбранного цвета */
  const addBtn = document.getElementById("product-add");
  addBtn.addEventListener("click", () => {
    window.Cart.add(product.id, selectedColor);
    addBtn.classList.add("is-added");
    addBtn.textContent = "Добавлено ✓";
    setTimeout(() => { addBtn.classList.remove("is-added"); addBtn.textContent = "в корзину"; }, 1200);
  });
});
