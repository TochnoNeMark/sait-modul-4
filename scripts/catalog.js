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
    // Чемоданы
    { id: "chemodan-1", category: "suitcase", name: "Чемодан 1", volume: "30 л", volumeFull: "30 литров", price: 100, rating: 5, desc: BASE_DESC, img: BASE_IMG },
    { id: "chemodan-2", category: "suitcase", name: "Чемодан 2", volume: "40 л", volumeFull: "40 литров", price: 150, rating: 5, desc: "Чемодан объемом 40 литров. Усиленные углы и телескопическая ручка, выдерживает перегрузки до 50 кг.", img: BASE_IMG },
    { id: "chemodan-3", category: "suitcase", name: "Чемодан 3", volume: "20 л", volumeFull: "20 литров", price: 90, rating: 4, desc: "Компактный чемодан 20 литров для ручной клади. Помещается в любой багажный отсек OpenWing.", img: BASE_IMG },
    { id: "chemodan-4", category: "suitcase", name: "Чемодан 4", volume: "60 л", volumeFull: "60 литров", price: 220, rating: 5, desc: "Вместительный чемодан 60 литров. Четыре сдвоенных колеса и кодовый замок TSA в комплекте.", img: BASE_IMG },
    { id: "chemodan-5", category: "suitcase", name: "Чемодан 5", volume: "30 л", volumeFull: "30 литров", price: 130, rating: 4, desc: "Чемодан 30 литров с водоотталкивающим покрытием. Идеален для частых перелётов.", img: BASE_IMG },
    { id: "chemodan-6", category: "suitcase", name: "Чемодан 6", volume: "45 л", volumeFull: "45 литров", price: 175, rating: 5, desc: "Премиальный чемодан 45 литров из поликарбоната. Лёгкий, прочный, с пожизненной гарантией.", img: BASE_IMG },

    // Подушки
    { id: "pillow-1", category: "pillow", name: "Подушка 1", volume: "дорожная", volumeFull: "дорожная", price: 990, rating: 5, desc: "Дорожная подушка-кот для шеи с маской для сна в комплекте. Мягкий плюш и удобная поддержка в полёте.", img: "assets/images/div5/pillow-cat.webp" },
    { id: "pillow-2", category: "pillow", name: "Подушка 2", volume: "дорожная", volumeFull: "дорожная", price: 1090, rating: 4, desc: "Дорожная подушка-акула для шеи с маской для сна. Объёмный плюш и эффектный дизайн.", img: "assets/images/div5/pillow-shark.webp" },
    { id: "pillow-3", category: "pillow", name: "Подушка 3", volume: "эффект памяти", volumeFull: "с эффектом памяти", price: 1490, rating: 5, desc: "Дорожная подушка с эффектом памяти, маской для сна, берушами и чехлом. Анатомическая поддержка шеи.", img: "assets/images/div5/pillow-memory.webp" },

    // Электроника
    { id: "power-1", category: "electronics", name: "Повербанк 1", volume: "10000 мА·ч", volumeFull: "10000 мА·ч", price: 2490, rating: 5, desc: "Магнитный повербанк 10000 мА·ч с беспроводной зарядкой MagSafe. Цифровой индикатор заряда, порты USB-A и USB-C.", img: "assets/images/div5/power-magsafe.webp" },
    { id: "power-2", category: "electronics", name: "Повербанк 2", volume: "20000 мА·ч", volumeFull: "20000 мА·ч", price: 2990, rating: 5, desc: "Повербанк 20000 мА·ч со встроенным кабелем USB-C и быстрой зарядкой. Дисплей точного заряда в процентах.", img: "assets/images/div5/power-cable.webp" },
    { id: "power-3", category: "electronics", name: "Повербанк 3", volume: "10000 мА·ч", volumeFull: "10000 мА·ч", price: 3490, rating: 4, desc: "Компактный повербанк 10000 мА·ч с тремя портами и умным дисплеем оставшегося времени зарядки.", img: "assets/images/div5/power-anker.webp" },
  ];

  // Категории мерча для переключателя в разделе «Мерч».
  window.CATEGORIES = [
    { key: "suitcase", label: "Чемоданы" },
    { key: "pillow", label: "Подушки" },
    { key: "electronics", label: "Электроника" },
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
