"use strict";

/**
 * Каталог мерча и логика корзины OpenWing.
 * Корзина хранится в localStorage: один ключ "openwing:cart" с объектом
 * вида { "имя товара": количество }. Итоговая стоимость считается по
 * ценам из каталога. Этот файл подключается на всех страницах, чтобы
 * кнопка «Корзина» в шапке всегда показывала актуальную сумму.
 */
(function () {
  // Один товар-образец из макета; вариации отличаются именем, ценой и описанием.
  const BASE_IMG = "assets/images/div5/chemodan.webp";
  const BASE_DESC =
    "Чемодан объемом 30 литров. Корпус сделан из ударопрочного пластика, проходит калибраторы OpenWing и Аэрофлота.";

  // Каталог. id — для ссылок на страницу товара, name — ключ корзины.
  window.PRODUCTS = [
    { id: "chemodan-1", name: "Чемодан 1", volume: "30 л", volumeFull: "30 литров", price: 100, rating: 5, desc: BASE_DESC, img: BASE_IMG },
    { id: "chemodan-2", name: "Чемодан 2", volume: "40 л", volumeFull: "40 литров", price: 150, rating: 5, desc: "Чемодан объемом 40 литров. Усиленные углы и телескопическая ручка, выдерживает перегрузки до 50 кг.", img: BASE_IMG },
    { id: "chemodan-3", name: "Чемодан 3", volume: "20 л", volumeFull: "20 литров", price: 90, rating: 4, desc: "Компактный чемодан 20 литров для ручной клади. Помещается в любой багажный отсек OpenWing.", img: BASE_IMG },
    { id: "chemodan-4", name: "Чемодан 4", volume: "60 л", volumeFull: "60 литров", price: 220, rating: 5, desc: "Вместительный чемодан 60 литров. Четыре сдвоенных колеса и кодовый замок TSA в комплекте.", img: BASE_IMG },
    { id: "chemodan-5", name: "Чемодан 5", volume: "30 л", volumeFull: "30 литров", price: 130, rating: 4, desc: "Чемодан 30 литров с водоотталкивающим покрытием. Идеален для частых перелётов.", img: BASE_IMG },
    { id: "chemodan-6", name: "Чемодан 6", volume: "45 л", volumeFull: "45 литров", price: 175, rating: 5, desc: "Премиальный чемодан 45 литров из поликарбоната. Лёгкий, прочный, с пожизненной гарантией.", img: BASE_IMG },
  ];

  window.getProduct = (id) => window.PRODUCTS.find((p) => p.id === id) || null;
  window.getProductByName = (name) => window.PRODUCTS.find((p) => p.name === name) || null;

  const CART_KEY = "openwing:cart";

  const readCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch (_) { return {}; }
  };
  const writeCart = (cart) => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
  };

  window.Cart = {
    get: readCart,
    add(name, qty = 1) {
      const cart = readCart();
      cart[name] = (cart[name] || 0) + qty;
      writeCart(cart);
      updateCartUI();
      return cart[name];
    },
    total() {
      const cart = readCart();
      return Object.entries(cart).reduce((sum, [name, count]) => {
        const p = window.getProductByName(name);
        return sum + (p ? p.price * count : 0);
      }, 0);
    },
    items() {
      const cart = readCart();
      return Object.entries(cart).map(([name, count]) => ({
        product: window.getProductByName(name), name, count,
      }));
    },
  };

  // Обновляет текст кнопки «Корзина» в шапке на всех страницах.
  function updateCartUI() {
    const link = document.getElementById("cart-link");
    if (!link) return;
    const total = window.Cart.total();
    link.textContent = total > 0 ? `Корзина: ${total}₽` : "Корзина";
  }
  window.updateCartUI = updateCartUI;

  document.addEventListener("DOMContentLoaded", updateCartUI);
})();
