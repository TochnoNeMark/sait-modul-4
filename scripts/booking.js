"use strict";

/**
 * Форма билетов (div 1.2) — интерактивная, ничего не отправляет.
 * Вкладки переключают содержимое панели:
 *   - «Покупка» + тумблер Билет/Отель: форма перелёта или отеля;
 *   - «Регистрация»: фамилия + номер заказа;
 *   - «Бронирование»: фамилия + номер заказа + место (ряд/место);
 *   - «Статус рейса»: номер заказа;
 *   - «Услуги»: ссылка на страницу тарифов (pricing.html, задана в HTML).
 * Все кнопки подтверждения сбрасывают свою форму. Город из главной
 * подставляется в «Куда» (sessionStorage openwing:destination).
 */
document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("booking-panel");
  const bottom = document.getElementById("booking-bottom");
  const tabs = Array.from(document.querySelectorAll(".tab[data-tab]"));
  if (!panel) return;

  /* ===================== ДАННЫЕ ===================== */
  const AIRPORTS = [
    { city: "Москва", airport: "Домодедово", code: "DME" },
    { city: "Москва", airport: "Шереметьево", code: "SVO" },
    { city: "Москва", airport: "Внуково", code: "VKO" },
    { city: "Санкт-Петербург", airport: "Пулково", code: "LED" },
    { city: "Казань", airport: "Казань", code: "KZN" },
    { city: "Уфа", airport: "Уфа", code: "UFA" },
    { city: "Краснодар", airport: "Пашковский", code: "KRR" },
    { city: "Волгоград", airport: "Гумрак", code: "VOG" },
    { city: "Волгда", airport: "Вологда", code: "VGD" },
    { city: "Тау Кита", airport: "Космопорт", code: "TAU" },
    { city: "Сочи", airport: "Адлер", code: "AER" },
    { city: "Екатеринбург", airport: "Кольцово", code: "SVX" },
    { city: "Новосибирск", airport: "Толмачёво", code: "OVB" },
    { city: "Калининград", airport: "Храброво", code: "KGD" },
  ];
  const CITY_ALIAS = { "Питер": "Санкт-Петербург" };
  const DEFAULT_ORIGIN = AIRPORTS[0];
  const HOTEL_CITIES = [...new Set(AIRPORTS.map((a) => a.city))];

  const MONTHS_NOM = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
  const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  const WEEKDAYS = ["пн","вт","ср","чт","пт","сб","вс"];

  const findByCity = (name) => {
    const canon = CITY_ALIAS[name] || name;
    return AIRPORTS.find((a) => a.city === canon) || null;
  };

  /* ===================== СОСТОЯНИЕ ===================== */
  const state = {
    tab: "purchase",
    toggle: "flight",
    origin: DEFAULT_ORIGIN, dest: null, depart: null, return: null,
    hotelCity: null, guests: 2, checkin: null, checkout: null,
    reg: { surname: "", order: "" },
    book: { surname: "", order: "", row: "", seat: "" },
    status: { order: "" },
  };

  const fmtDate = (d) => d ? `${d.day} ${MONTHS_GEN[d.month]} ${d.year}` : null;
  const escAttr = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ===================== ЗАКРЫТИЕ ПОПАПОВ ===================== */
  const closeAllPopups = () => {
    panel.querySelectorAll(".dropdown, .calendar").forEach((el) => (el.hidden = true));
    panel.querySelectorAll(".field__btn[aria-expanded='true']").forEach((b) => b.setAttribute("aria-expanded", "false"));
  };
  document.addEventListener("click", closeAllPopups);

  /* ===================== КОМПОНЕНТ: выпадающий список ===================== */
  function attachDropdown(field, options, getVal, setVal) {
    const btn = field.querySelector(".field__btn");
    const dd = document.createElement("div");
    dd.className = "dropdown";
    dd.hidden = true;
    dd.setAttribute("role", "listbox");
    dd.innerHTML = options.map((o, i) =>
      `<button type="button" class="dropdown__opt" role="option" data-i="${i}">${o.label}${o.sub ? ` <span>${o.sub}</span>` : ""}</button>`).join("");
    field.appendChild(dd);
    dd.addEventListener("click", (e) => {
      const opt = e.target.closest(".dropdown__opt");
      if (!opt) return;
      setVal(options[+opt.dataset.i].value);
      closeAllPopups();
    });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = dd.hidden;
      closeAllPopups();
      if (willOpen) {
        const cur = getVal();
        dd.querySelectorAll(".dropdown__opt").forEach((o, i) =>
          o.classList.toggle("is-current", JSON.stringify(options[i].value) === JSON.stringify(cur)));
        dd.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
  }

  /* ===================== КОМПОНЕНТ: календарь ===================== */
  function attachCalendar(field, getVal, setVal, alignRight = false) {
    const btn = field.querySelector(".field__btn");
    const cal = document.createElement("div");
    cal.className = "calendar" + (alignRight ? " calendar--right" : "");
    cal.hidden = true;
    cal.setAttribute("role", "dialog");
    cal.addEventListener("click", (e) => e.stopPropagation());
    field.appendChild(cal);

    const now = new Date();
    const view = { year: now.getFullYear(), month: now.getMonth() };

    const build = () => {
      cal.innerHTML = "";
      const head = document.createElement("div");
      head.className = "calendar__head";
      const yearSel = document.createElement("select");
      yearSel.className = "calendar__select calendar__select--year";
      for (let y = now.getFullYear(); y <= now.getFullYear() + 2; y++) {
        const o = document.createElement("option");
        o.value = y; o.textContent = "Год: " + y;
        if (y === view.year) o.selected = true;
        yearSel.appendChild(o);
      }
      yearSel.addEventListener("change", () => { view.year = +yearSel.value; days(); });
      const monthSel = document.createElement("select");
      monthSel.className = "calendar__select calendar__select--month";
      MONTHS_NOM.forEach((m, i) => {
        const o = document.createElement("option");
        o.value = i; o.textContent = "Месяц: " + m;
        if (i === view.month) o.selected = true;
        monthSel.appendChild(o);
      });
      monthSel.addEventListener("change", () => { view.month = +monthSel.value; days(); });
      head.append(yearSel, monthSel);
      cal.appendChild(head);

      const grid = document.createElement("div");
      grid.className = "calendar__grid";
      WEEKDAYS.forEach((w) => {
        const c = document.createElement("div");
        c.className = "calendar__wd"; c.textContent = w;
        grid.appendChild(c);
      });
      cal.appendChild(grid);
      days();

      function days() {
        grid.querySelectorAll(".calendar__day").forEach((d) => d.remove());
        const first = new Date(view.year, view.month, 1);
        const lead = (first.getDay() + 6) % 7;
        const total = new Date(view.year, view.month + 1, 0).getDate();
        const sel = getVal();
        for (let i = 0; i < lead; i++) {
          const e = document.createElement("span");
          e.className = "calendar__day is-empty";
          grid.appendChild(e);
        }
        for (let d = 1; d <= total; d++) {
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "calendar__day";
          cell.textContent = d;
          if (sel && sel.year === view.year && sel.month === view.month && sel.day === d) cell.classList.add("is-selected");
          cell.addEventListener("click", () => {
            setVal({ year: view.year, month: view.month, day: d });
            closeAllPopups();
          });
          grid.appendChild(cell);
        }
      }
    };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = cal.hidden;
      closeAllPopups();
      if (willOpen) {
        const sel = getVal();
        if (sel) { view.year = sel.year; view.month = sel.month; }
        build();
        cal.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
  }

  /* ===================== ШАБЛОНЫ ПОЛЕЙ ===================== */
  const placeFieldHTML = (place, value, code, placeholder) => `
    <div class="field field--place" data-field="${place}">
      <button type="button" class="field__btn" aria-haspopup="listbox" aria-expanded="false">
        <span class="field__value${value ? "" : " field__value--placeholder"}">${value || placeholder}</span>
        <span class="field__code">${code || ""}</span>
      </button>
    </div>`;
  const dateFieldHTML = (key, value, placeholder) => `
    <div class="field field--date" data-field="${key}">
      <button type="button" class="field__btn" aria-haspopup="dialog" aria-expanded="false">
        <span class="field__value${value ? "" : " field__value--placeholder"}">${value || placeholder}</span>
      </button>
    </div>`;
  const textFieldHTML = (key, value, placeholder) => `
    <div class="field field--text">
      <input type="text" class="field__input" data-field="${key}" value="${escAttr(value)}" placeholder="${placeholder}" autocomplete="off">
    </div>`;

  /* ===================== РЕНДЕР ===================== */
  function render() {
    closeAllPopups();
    tabs.forEach((t) => {
      const active = t.dataset.tab === state.tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    panel.innerHTML = "";
    bottom.innerHTML = "";
    if (state.tab === "purchase") renderPurchase();
    else if (state.tab === "registration") renderRegistration();
    else if (state.tab === "booking") renderBooking();
    else if (state.tab === "status") renderStatus();
  }

  function renderPurchase() {
    const toggles = `
      <div class="booking__toggles">
        <button type="button" class="toggle ${state.toggle === "flight" ? "is-active" : ""}" data-toggle="flight">Билет</button>
        <button type="button" class="toggle ${state.toggle === "hotel" ? "is-active" : ""}" data-toggle="hotel">Отель</button>
      </div>`;

    if (state.toggle === "flight") {
      panel.innerHTML = toggles + `
        <form class="booking__form" autocomplete="off">
          ${placeFieldHTML("origin", state.origin ? `${state.origin.city}, ${state.origin.airport}` : "", state.origin ? state.origin.code : "", "Откуда")}
          <button type="button" class="swap" id="swap-btn" aria-label="Поменять «Откуда» и «Куда» местами">
            <svg viewBox="0 0 58 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 4 H54 M48 -1 L55 4 L48 9" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M56 16 H4 M10 11 L3 16 L10 21" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          ${placeFieldHTML("dest", state.dest ? `${state.dest.city}, ${state.dest.airport}` : "", state.dest ? state.dest.code : "", "Куда")}
          ${dateFieldHTML("depart", fmtDate(state.depart), "Туда (дата)")}
          ${dateFieldHTML("return", fmtDate(state.return), "Обратно (дата)")}
        </form>`;
      wireFlight();
    } else {
      panel.innerHTML = toggles + `
        <form class="booking__form" autocomplete="off">
          <div class="field field--place" data-field="hotelCity">
            <button type="button" class="field__btn" aria-haspopup="listbox" aria-expanded="false">
              <span class="field__value${state.hotelCity ? "" : " field__value--placeholder"}">${state.hotelCity || "Город, населенный пункт"}</span>
            </button>
          </div>
          <div class="field field--guests">
            <span class="field__value">Гостей: <b data-guests>${state.guests}</b></span>
            <span class="guests__ctrl">
              <button type="button" class="guests__btn" data-guests-dec aria-label="Меньше гостей">−</button>
              <button type="button" class="guests__btn" data-guests-inc aria-label="Больше гостей">+</button>
            </span>
          </div>
          ${dateFieldHTML("checkin", fmtDate(state.checkin), "Заселение (дата)")}
          ${dateFieldHTML("checkout", fmtDate(state.checkout), "Выезд (дата)")}
        </form>`;
      wireHotel();
    }

    bottom.innerHTML = `<button type="button" class="booking__submit" id="purchase-reset">Найти</button>`;
    document.getElementById("purchase-reset").addEventListener("click", resetPurchase);
    panel.querySelectorAll(".toggle[data-toggle]").forEach((b) =>
      b.addEventListener("click", () => { state.toggle = b.dataset.toggle; render(); }));
  }

  function wireFlight() {
    const opts = AIRPORTS.map((a) => ({ label: `<b>${a.city}</b>, ${a.airport}`, sub: a.code, value: a }));
    attachDropdown(panel.querySelector('[data-field="origin"]'), opts, () => state.origin, (v) => { state.origin = v; render(); });
    attachDropdown(panel.querySelector('[data-field="dest"]'), opts, () => state.dest, (v) => { state.dest = v; render(); });
    attachCalendar(panel.querySelector('[data-field="depart"]'), () => state.depart, (v) => { state.depart = v; render(); });
    attachCalendar(panel.querySelector('[data-field="return"]'), () => state.return, (v) => { state.return = v; render(); }, true);
    document.getElementById("swap-btn").addEventListener("click", () => {
      [state.origin, state.dest] = [state.dest, state.origin];
      render();
    });
  }

  function wireHotel() {
    const opts = HOTEL_CITIES.map((c) => ({ label: `<b>${c}</b>`, value: c }));
    attachDropdown(panel.querySelector('[data-field="hotelCity"]'), opts, () => state.hotelCity, (v) => { state.hotelCity = v; render(); });
    attachCalendar(panel.querySelector('[data-field="checkin"]'), () => state.checkin, (v) => { state.checkin = v; render(); });
    attachCalendar(panel.querySelector('[data-field="checkout"]'), () => state.checkout, (v) => { state.checkout = v; render(); }, true);
    panel.querySelector("[data-guests-dec]").addEventListener("click", () => { state.guests = Math.max(1, state.guests - 1); render(); });
    panel.querySelector("[data-guests-inc]").addEventListener("click", () => { state.guests = Math.min(20, state.guests + 1); render(); });
  }

  function resetPurchase() {
    state.origin = DEFAULT_ORIGIN; state.dest = null; state.depart = null; state.return = null;
    state.hotelCity = null; state.guests = 2; state.checkin = null; state.checkout = null;
    try { sessionStorage.removeItem("openwing:destination"); } catch (_) {}
    render();
  }

  function renderRegistration() {
    panel.innerHTML = `
      <form class="booking__form booking__form--reg" id="reg-form" autocomplete="off">
        ${textFieldHTML("reg.surname", state.reg.surname, "Фамилия пассажира")}
        ${textFieldHTML("reg.order", state.reg.order, "Номер заказа или брони")}
        <div class="field field--action">
          <button type="submit" class="field__submit">Регистрация</button>
        </div>
      </form>
      <p class="booking__note">Онлайн-регистрация на рейс открывается за 30 часов до планового времени вылета.</p>`;
    wireText("#reg-form", state.reg);
    document.getElementById("reg-form").addEventListener("submit", (e) => {
      e.preventDefault();
      state.reg = { surname: "", order: "" };
      render();
    });
  }

  function renderBooking() {
    const rowOpts = Array.from({ length: 30 }, (_, i) => i + 1);
    const seatOpts = ["A", "B", "C", "D", "E", "F"];
    panel.innerHTML = `
      <form class="booking__form" id="book-form" autocomplete="off">
        ${textFieldHTML("book.surname", state.book.surname, "Фамилия пассажира")}
        ${textFieldHTML("book.order", state.book.order, "Номер заказа или брони")}
        <div class="field field--seat">
          <label class="seat__label">Место:</label>
          <select class="seat__select" data-field="book.row" aria-label="Ряд">
            <option value="" ${state.book.row ? "" : "selected"} disabled hidden>Ряд</option>
            ${rowOpts.map((r) => `<option value="${r}" ${state.book.row == r ? "selected" : ""}>Ряд ${r}</option>`).join("")}
          </select>
          <select class="seat__select" data-field="book.seat" aria-label="Место">
            <option value="" ${state.book.seat ? "" : "selected"} disabled hidden>Место</option>
            ${seatOpts.map((s) => `<option value="${s}" ${state.book.seat === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
      </form>
      <p class="booking__note">Только зарегестрированные пассажиры могут забронировать места.</p>`;
    wireText("#book-form", state.book);
    panel.querySelectorAll(".seat__select").forEach((sel) =>
      sel.addEventListener("change", () => { state.book[sel.dataset.field.split(".")[1]] = sel.value; }));
    bottom.innerHTML = `<button type="button" class="booking__submit" id="book-submit">Забронировать место</button>`;
    document.getElementById("book-submit").addEventListener("click", () => {
      state.book = { surname: "", order: "", row: "", seat: "" };
      render();
    });
  }

  function renderStatus() {
    panel.innerHTML = `
      <form class="booking__form booking__form--status" id="status-form" autocomplete="off">
        ${textFieldHTML("status.order", state.status.order, "Номер заказа или брони")}
        <div class="field field--action field--action-wide">
          <button type="submit" class="field__submit">Найти рейс</button>
        </div>
      </form>`;
    wireText("#status-form", state.status);
    document.getElementById("status-form").addEventListener("submit", (e) => {
      e.preventDefault();
      state.status = { order: "" };
      render();
    });
  }

  function wireText(formSel, store) {
    panel.querySelectorAll(`${formSel} .field__input`).forEach((inp) => {
      const key = inp.dataset.field.split(".")[1];
      inp.addEventListener("input", () => { store[key] = inp.value; });
    });
  }

  /* ===================== МОСТ ИЗ DIV 1: город из главной -> «Куда» ===================== */
  try {
    const saved = sessionStorage.getItem("openwing:destination");
    if (saved) {
      const a = findByCity(saved);
      if (a) state.dest = a;
    }
  } catch (_) {}

  /* ===================== ВКЛАДКИ ===================== */
  tabs.forEach((t) =>
    t.addEventListener("click", () => { state.tab = t.dataset.tab; render(); }));

  render();
});
