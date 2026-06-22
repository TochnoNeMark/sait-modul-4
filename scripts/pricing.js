"use strict";

/**
 * Раздел тарифов OpenWing (div 1.6.1–1.6.3).
 *
 * Состоит из промо OpenWing+ и трёх разделов услуг (Места / Питание /
 * Дополнительно). Работает похоже на «Мерч», но со своими правилами:
 *   - своя корзина услуг (localStorage "openwing:services"), отдельная от
 *     корзины мерча ("openwing:cart");
 *   - «Места» и «Питание» — single-select: добавление услуги заменяет
 *     предыдущую из того же раздела (в корзине только одна на раздел);
 *   - «Дополнительно» — услуги не заменяют друг друга: трансфер и лаундж —
 *     по 1, дополнительный багаж — до 2;
 *   - «Подробнее» открывает модалку (как карточка товара, но без выбора
 *     цвета и без отзывов);
 *   - OpenWing+ — годовая подписка (флаг "openwing:plus"). После активации:
 *       • цены всех услуг −5%;
 *       • в «Питании» появляется бесплатный кофе (не заменяет еду);
 *       • в «Дополнительно» появляется бесплатный журнал — при добавлении
 *         скачивается PDF.
 * Подписка — демо-флаг, ничего реально не оплачивается.
 */
(function () {
  const PLUS_KEY = "openwing:plus";
  const SCART_KEY = "openwing:services";
  const DISCOUNT = 0.05; // −5% при активной подписке
  const MAG_PDF = "assets/openwing-plus-magazine.pdf";
  const IMG = "assets/images/div6/services/";

  /* ---------- Каталог услуг ----------
     section: place | food | extra
     single:  добавление заменяет другую single-услугу этого раздела (макс. 1)
     max:     максимальное количество в корзине
     plus:    доступна только при активной подписке
     free:    всегда бесплатно (скидка не применяется)
     download:при добавлении скачивается PDF                                  */
  const SERVICES = [
    // ----- Место (single-select) -----
    { id: "seat-standard", section: "place", name: "Стандарт", price: 0, single: true, max: 1,
      img: IMG + "svc-seat-standard.webp",
      short: "Обычное место в салоне — ничего лишнего.",
      desc: "Обычное место в салоне. Без доплат и условий — просто летите туда, куда нужно. Базовый вариант, который входит в любой билет OpenWing." },
    { id: "seat-legroom", section: "place", name: "Дополнительное место для ног", price: 100, single: true, max: 1,
      img: IMG + "svc-seat-legroom.webp",
      short: "Кресло у выхода или в первом ряду — больше места для ног.",
      desc: "Место у аварийного выхода или в первом ряду: до 15 см дополнительного пространства для ног на весь полёт. Особенно оценят высокие пассажиры и любители вытянуться." },
    { id: "seat-best", section: "place", name: "Лучшее обслуживание", price: 1000, single: true, max: 1,
      img: IMG + "svc-seat-best.webp",
      short: "Передний ряд, приоритетная посадка и максимум внимания.",
      desc: "Место в передней части салона, приоритетная посадка и высадка, расширенное меню и максимум внимания экипажа. Для тех, кто хочет от полёта большего." },

    // ----- Питание (single-select) -----
    { id: "food-standard", section: "food", name: "Стандарт", price: 100, single: true, max: 1,
      img: IMG + "svc-seat-standard.webp",
      short: "Горячее на выбор, напиток и десерт.",
      desc: "Горячее блюдо на выбор (мясо, курица или рыба), гарнир, напиток и десерт. Сытно, привычно и вкусно — стандарт хорошего рейса." },
    { id: "food-child", section: "food", name: "Детское", price: 80, single: true, max: 1,
      img: IMG + "svc-seat-legroom.webp",
      short: "Порция поменьше и любимые детьми блюда.",
      desc: "Порция поменьше и блюда, которые любят дети: еда без острых специй, сок и небольшой сюрприз. Чтобы маленький пассажир долетел довольным." },
    { id: "food-veg", section: "food", name: "Вегетарианское", price: 120, single: true, max: 1,
      img: IMG + "svc-seat-best.webp",
      short: "Блюдо без мяса и рыбы — на овощах и крупах.",
      desc: "Блюдо без мяса и рыбы: овощи, крупы, бобовые и свежий салат. Сбалансированно и сытно — подойдёт вегетарианцам и тем, кто хочет поесть полегче." },
    // бесплатный кофе (только +; не заменяет еду)
    { id: "food-coffee", section: "food", name: "Кофе", price: 0, free: true, plus: true, max: 1,
      img: IMG + "svc-coffee.webp",
      short: "Свежесваренный кофе в полёте. Бесплатно для подписчиков +.",
      desc: "Свежесваренный кофе в полёте — столько, сколько захотите. Доступен бесплатно для подписчиков OpenWing+ и не заменяет основное питание." },

    // ----- Дополнительно (свои лимиты, не заменяют друг друга) -----
    { id: "extra-transfer", section: "extra", name: "Трансфер до аэропорта", price: 200, max: 1,
      img: IMG + "svc-seat-standard.webp",
      short: "Машина довезёт от дома до терминала и обратно.",
      desc: "Комфортная машина встретит вас у терминала и довезёт до дома или отеля (либо заберёт перед вылетом). Водитель отслеживает рейс — даже при задержке вас дождутся." },
    { id: "extra-baggage", section: "extra", name: "Дополнительный багаж", price: 100, max: 2,
      img: IMG + "svc-baggage.webp",
      short: "Ещё одно место багажа до 23 кг. Можно добавить дважды.",
      desc: "Ещё одно место багажа до 23 кг сверх нормы тарифа. Можно добавить до двух раз — для тех, кто везёт подарки, оборудование или просто любит запас." },
    { id: "extra-lounge", section: "extra", name: "Лаундж-зона", price: 120, max: 1,
      img: IMG + "svc-lounge.webp",
      short: "Бизнес-зал перед вылетом: тишина, кресла, еда.",
      desc: "Доступ в бизнес-зал перед вылетом: тишина, удобные кресла, еда и напитки, душ и Wi-Fi. Идеально, чтобы переждать стыковку или просто начать поездку спокойно." },
    // бесплатный журнал (только +; при добавлении скачивается PDF)
    { id: "extra-magazine", section: "extra", name: "Журнал OpenWing", price: 0, free: true, plus: true, max: 1, download: true,
      img: IMG + "svc-magazine.webp",
      short: "Печатный журнал на борту. PDF — прямо сейчас.",
      desc: "Раз в месяц вы можете получить выпуск нашего печатного издания. Физическая копия будет ждать вас на борту, а пока вы можете прочесть его на своём устройстве." },
  ];

  const SECTIONS = [
    { key: "place", title: "Место" },
    { key: "food", title: "Питание" },
    { key: "extra", title: "Дополнительно" },
  ];

  const byId = (id) => SERVICES.find((s) => s.id === id) || null;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Подписка ---------- */
  const isPlus = () => { try { return localStorage.getItem(PLUS_KEY) === "1"; } catch (_) { return false; } };
  const setPlus = (on) => { try { localStorage.setItem(PLUS_KEY, on ? "1" : "0"); } catch (_) {} };

  // Цена услуги с учётом подписки (−5%, кроме бесплатных).
  const priceOf = (svc) => svc.free ? 0 : (isPlus() ? Math.round(svc.price * (1 - DISCOUNT)) : svc.price);
  // Услуга доступна для показа/добавления (plus-услуги — только при подписке).
  const isAvailable = (svc) => !svc.plus || isPlus();

  /* ---------- Корзина услуг ---------- */
  const readCart = () => {
    let raw; try { raw = JSON.parse(localStorage.getItem(SCART_KEY)); } catch (_) { raw = null; }
    if (!raw || typeof raw !== "object") return {};
    const clean = {};
    for (const [id, n] of Object.entries(raw)) {
      if (byId(id) && Number.isFinite(n) && n > 0) clean[id] = n;
    }
    return clean;
  };
  const writeCart = (cart) => { try { localStorage.setItem(SCART_KEY, JSON.stringify(cart)); } catch (_) {} };

  function addService(id) {
    const svc = byId(id);
    if (!svc || !isAvailable(svc)) return;
    const cart = readCart();
    // single-select: убираем другую single-услугу этого раздела
    if (svc.single) {
      for (const other of SERVICES) {
        if (other.section === svc.section && other.single && other.id !== id) delete cart[other.id];
      }
    }
    const prev = cart[id] || 0;
    const max = svc.max || 99;
    cart[id] = Math.min(prev + 1, max);
    writeCart(cart);
    if (svc.download && prev === 0) downloadMagazine();
  }
  function setCount(id, n) {
    const svc = byId(id);
    if (!svc) return;
    const cart = readCart();
    n = Math.max(0, Math.min(n, svc.max || 99));
    if (n <= 0) delete cart[id]; else cart[id] = n;
    writeCart(cart);
  }
  function removeService(id) { const cart = readCart(); delete cart[id]; writeCart(cart); }

  const cartItems = () => Object.entries(readCart())
    .map(([id, n]) => ({ svc: byId(id), count: n })).filter((i) => i.svc);
  const cartTotal = () => cartItems().reduce((sum, i) => sum + priceOf(i.svc) * i.count, 0);

  function downloadMagazine() {
    const a = document.createElement("a");
    a.href = MAG_PDF;
    a.download = "OpenWing-magazine.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ========== Рендер ========== */
  let modalEl = null;

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("tariffs")) return;
    modalEl = document.getElementById("svc-modal");
    bindPlusButton();
    bindModal();
    bindNavScrollspy();
    bindClicks();
    renderAll();
  });

  function renderAll() {
    renderSections();
    renderCartPanel();
    updatePlusUI();
  }

  function cardHTML(svc) {
    const inCart = readCart()[svc.id] || 0;
    const price = priceOf(svc);
    const old = (!svc.free && isPlus()) ? `<s class="svc-card__old">${svc.price}₽</s> ` : "";
    const priceLabel = svc.free ? "Бесплатно" : `${old}${price}₽`;
    return `
      <article class="svc-card${svc.plus ? " svc-card--plus" : ""}" data-id="${esc(svc.id)}">
        <div class="svc-card__head">${esc(svc.name)} · ${priceLabel}</div>
        <div class="svc-card__body">
          <div class="svc-card__img"><img src="${svc.img}" alt="${esc(svc.name)}" loading="lazy"></div>
          <p class="svc-card__desc">${esc(svc.short)}</p>
        </div>
        <div class="svc-card__foot">
          <button type="button" class="svc-card__add${inCart ? " is-in" : ""}" data-add="${esc(svc.id)}">${inCart ? `В корзине: ${inCart}` : "В корзину"}</button>
          <button type="button" class="svc-card__more" data-more="${esc(svc.id)}">Подробнее</button>
        </div>
      </article>`;
  }

  function renderSections() {
    for (const sec of SECTIONS) {
      const box = document.getElementById(`svc-grid-${sec.key}`);
      if (!box) continue;
      box.innerHTML = SERVICES.filter((s) => s.section === sec.key && isAvailable(s)).map(cardHTML).join("");
    }
  }

  function renderCartPanel() {
    const box = document.getElementById("svc-cart");
    if (box) {
      const items = cartItems();
      if (!items.length) {
        box.innerHTML = `<p class="svc-cart__empty">Корзина услуг пуста. Соберите перелёт под себя в разделах выше.</p>`;
      } else {
        box.innerHTML = items.map((i) => {
          const price = priceOf(i.svc);
          const free = i.svc.free;
          return `
            <div class="svc-cart__row" data-id="${esc(i.svc.id)}">
              <span class="svc-cart__name">${esc(i.svc.name)}</span>
              <span class="svc-cart__unit">${free ? "бесплатно" : price + "₽"}</span>
              <div class="svc-cart__qty" role="group" aria-label="Количество">
                <button type="button" class="svc-qty" data-act="dec" aria-label="Уменьшить">−</button>
                <span class="svc-cart__count">${i.count}</span>
                <button type="button" class="svc-qty" data-act="inc" aria-label="Увеличить">+</button>
              </div>
              <span class="svc-cart__sum">${free ? "0₽" : price * i.count + "₽"}</span>
              <button type="button" class="svc-cart__del" data-act="remove" aria-label="Удалить">✕</button>
            </div>`;
        }).join("") + `<div class="svc-cart__total">Итого услуг: <b>${cartTotal()}₽</b></div>`;
      }
    }
    updateHeaderCart();
  }

  function updateHeaderCart() {
    const link = document.getElementById("cart-link");
    if (!link) return;
    const t = cartTotal();
    link.textContent = t > 0 ? `Услуги: ${t}₽` : "Корзина";
  }

  /* ---------- Подписка (UI) ---------- */
  function bindPlusButton() {
    const btn = document.getElementById("plus-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const turningOn = !isPlus();
      setPlus(turningOn);
      if (!turningOn) {
        // при отключении подписки убираем из корзины plus-услуги
        const cart = readCart();
        SERVICES.filter((s) => s.plus).forEach((s) => delete cart[s.id]);
        writeCart(cart);
      }
      renderAll();
    });
  }
  function updatePlusUI() {
    const on = isPlus();
    document.body.classList.toggle("is-plus", on);
    const btn = document.getElementById("plus-toggle");
    if (btn) btn.textContent = on ? "Вы в плюсе ✓ — отключить" : "Быть в плюсе";
    const note = document.getElementById("plus-note");
    if (note) note.textContent = on
      ? "OpenWing+ активен: −5% на все услуги, бесплатный кофе в «Питании» и журнал в «Дополнительно»."
      : "";
  }

  /* ---------- Модалка «Подробнее» ---------- */
  function openModal(id) {
    const svc = byId(id);
    if (!svc || !modalEl) return;
    const price = priceOf(svc);
    const inCart = readCart()[svc.id] || 0;
    modalEl.querySelector("[data-m-img]").src = svc.img;
    modalEl.querySelector("[data-m-img]").alt = svc.name;
    modalEl.querySelector("[data-m-title]").textContent = svc.name;
    modalEl.querySelector("[data-m-price]").innerHTML = svc.free
      ? "Бесплатно"
      : (isPlus() ? `<s>${svc.price}₽</s> ${price} ₽` : `${price} ₽`);
    modalEl.querySelector("[data-m-desc]").textContent = svc.desc;
    const add = modalEl.querySelector("[data-m-add]");
    add.dataset.add = svc.id;
    add.textContent = inCart ? `В корзине: ${inCart}` : "В корзину";
    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function refreshModalAdd() {
    if (!modalEl || !modalEl.classList.contains("is-open")) return;
    const add = modalEl.querySelector("[data-m-add]");
    if (add && add.dataset.add) {
      const c = readCart()[add.dataset.add] || 0;
      add.textContent = c ? `В корзине: ${c}` : "В корзину";
    }
  }
  function bindModal() {
    if (!modalEl) return;
    modalEl.addEventListener("click", (e) => {
      if (e.target.matches("[data-m-close]") || e.target === modalEl) closeModal();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }

  /* ---------- Делегирование кликов ---------- */
  function bindClicks() {
    document.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        addService(addBtn.dataset.add);
        renderSections();
        renderCartPanel();
        refreshModalAdd();
        return;
      }
      const moreBtn = e.target.closest("[data-more]");
      if (moreBtn) { openModal(moreBtn.dataset.more); return; }

      const cartBtn = e.target.closest(".svc-cart__row [data-act]");
      if (cartBtn) {
        const row = cartBtn.closest(".svc-cart__row");
        const id = row.dataset.id;
        const cur = readCart()[id] || 0;
        if (cartBtn.dataset.act === "inc") setCount(id, cur + 1);
        else if (cartBtn.dataset.act === "dec") setCount(id, cur - 1);
        else removeService(id);
        renderSections();
        renderCartPanel();
        refreshModalAdd();
      }
    });
  }

  /* ---------- Скролл-спай для шапки-якорей ---------- */
  function bindNavScrollspy() {
    const links = [...document.querySelectorAll(".nav__btn[data-anchor]")];
    if (!links.length) return;
    const map = new Map(links.map((l) => [l.dataset.anchor, l]));
    const targets = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    if (!("IntersectionObserver" in window) || !targets.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.remove("is-active"));
        const link = map.get(en.target.id);
        if (link) link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    targets.forEach((t) => obs.observe(t));
  }
})();
