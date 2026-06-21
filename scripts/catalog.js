"use strict";

/**
 * Каталог мерча и логика корзины OpenWing.
 * Корзина хранится в localStorage под ключом "openwing:cart" как объект
 * позиций: ключ позиции = `<id товара>__<ключ цвета>`, значение =
 * { id, colorKey, count }. Цена и название берутся из каталога по id.
 * Учёт цвета: один и тот же товар разных цветов — это разные позиции.
 * Файл подключается на всех страницах: кнопка «Корзина» в шапке всегда
 * показывает актуальную сумму.
 */
(function () {
  const BASE_IMG = "assets/images/div5/chemodan.webp";
  const BASE_DESC =
    "Чемодан объемом 30 литров. Корпус сделан из ударопрочного пластика, проходит калибраторы OpenWing и Аэрофлота.";

  window.PRODUCTS = [
    { id: "chemodan-1", name: "Чемодан 1", volume: "30 л", volumeFull: "30 литров", price: 100, rating: 5, desc: BASE_DESC, img: BASE_IMG },
    { id: "chemodan-2", name: "Чемодан 2", volume: "40 л", volumeFull: "40 литров", price: 150, rating: 5, desc: "Чемодан объемом 40 литров. Усиленные углы и телескопическая ручка, выдерживает перегрузки до 50 кг.", img: BASE_IMG },
    { id: "chemodan-3", name: "Чемодан 3", volume: "20 л", volumeFull: "20 литров", price: 90, rating: 4, desc: "Компактный чемодан 20 литров для ручной клади. Помещается в любой багажный отсек OpenWing.", img: BASE_IMG },
    { id: "chemodan-4", name: "Чемодан 4", volume: "60 л", volumeFull: "60 литров", price: 220, rating: 5, desc: "Вместительный чемодан 60 литров. Четыре сдвоенных колеса и кодовый замок TSA в комплекте.", img: BASE_IMG },
    { id: "chemodan-5", name: "Чемодан 5", volume: "30 л", volumeFull: "30 литров", price: 130, rating: 4, desc: "Чемодан 30 литров с водоотталкивающим покрытием. Идеален для частых перелётов.", img: BASE_IMG },
    { id: "chemodan-6", name: "Чемодан 6", volume: "45 л", volumeFull: "45 литров", price: 175, rating: 5, desc: "Премиальный чемодан 45 литров из поликарбоната. Лёгкий, прочный, с пожизненной гарантией.", img: BASE_IMG },
  ];

  // Доступные цвета товара (общие для страницы товара и корзины).
  window.COLORS = [
    { key: "none", label: "обычный" },
    { key: "red", label: "красный" },
    { key: "blue", label: "синий" },
    { key: "green", label: "зелёный" },
  ];

  window.getProduct = (id) => window.PRODUCTS.find((p) => p.id === id) || null;
  window.getColor = (key) => window.COLORS.find((c) => c.key === key) || window.COLORS[0];
  const lineKey = (id, colorKey) => `${id}__${colorKey}`;

  const CART_KEY = "openwing:cart";

  const readCart = () => {
    let raw;
    try { raw = JSON.parse(localStorage.getItem(CART_KEY)); } catch (_) { raw = null; }
    if (!raw || typeof raw !== "object") return {};
    // оставляем только корректные структурные позиции (с id и count)
    const clean = {};
    for (const [key, v] of Object.entries(raw)) {
      if (v && typeof v === "object" && v.id && Number.isFinite(v.count) && v.count > 0) {
        clean[key] = { id: v.id, colorKey: v.colorKey || "none", count: v.count };
      }
    }
    return clean;
  };
  const writeCart = (cart) => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
    updateCartUI();
  };

  window.Cart = {
    get: readCart,

    add(id, colorKey = "none", qty = 1) {
      const cart = readCart();
      const key = lineKey(id, colorKey);
      const cur = cart[key] ? cart[key].count : 0;
      cart[key] = { id, colorKey, count: cur + qty };
      writeCart(cart);
      return cart[key].count;
    },

    setCount(key, count) {
      const cart = readCart();
      if (!cart[key]) return;
      if (count <= 0) delete cart[key];
      else cart[key].count = count;
      writeCart(cart);
    },

    remove(key) {
      const cart = readCart();
      delete cart[key];
      writeCart(cart);
    },

    items() {
      const cart = readCart();
      return Object.entries(cart).map(([key, v]) => ({
        key,
        product: window.getProduct(v.id),
        color: window.getColor(v.colorKey),
        colorKey: v.colorKey,
        count: v.count,
      })).filter((i) => i.product);
    },

    total() {
      return this.items().reduce((sum, i) => sum + i.product.price * i.count, 0);
    },
  };

  function updateCartUI() {
    const link = document.getElementById("cart-link");
    if (!link) return;
    const total = window.Cart.total();
    link.textContent = total > 0 ? `Корзина: ${total}₽` : "Корзина";
  }
  window.updateCartUI = updateCartUI;

  document.addEventListener("DOMContentLoaded", updateCartUI);
})();
