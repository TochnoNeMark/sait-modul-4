"use strict";

/**
 * Интерактивная (нефункциональная) форма покупки билетов — div 2.
 * Ничего не отправляет и не выставляет счетов. Реализовано:
 *  - поля «Откуда» / «Куда» с выпадающим списком городов и аэропортов;
 *  - «Откуда» по умолчанию — Москва, Домодедово; «Куда» — пустое;
 *  - кнопка ⇄ меняет «Откуда» и «Куда» местами;
 *  - поля «Туда» / «Обратно» открывают календарь (год/месяц — выпадающие
 *    списки, клик по числу сохраняет дату, выбранная дата подсвечена,
 *    клик мимо — закрытие без сохранения);
 *  - кнопка «Найти» сбрасывает форму в начальное состояние;
 *  - выбор города в div 1 заполняет «Куда» (мост через #dest-input).
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form");
  if (!form) return;

  /* ---- Справочник аэропортов ---- */
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

  // Псевдонимы названий городов из div 1 -> канонический город справочника.
  const CITY_ALIAS = { "Питер": "Санкт-Петербург" };

  const DEFAULT_ORIGIN = AIRPORTS[0]; // Москва, Домодедово (DME)

  /* ---- Локализация дат ---- */
  const MONTHS_NOM = ["январь","февраль","март","апрель","май","июнь",
    "июль","август","сентябрь","октябрь","ноябрь","декабрь"];
  const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня",
    "июля","августа","сентября","октября","ноября","декабря"];
  const WEEKDAYS = ["пн","вт","ср","чт","пт","сб","вс"];

  /* ---- Состояние формы ---- */
  const state = { origin: DEFAULT_ORIGIN, dest: null, depart: null, return: null };

  /* ---- Утилиты ---- */
  const findByCity = (name) => {
    const canonical = CITY_ALIAS[name] || name;
    return AIRPORTS.find((a) => a.city === canonical) || null;
  };
  const closeAllPopups = () => {
    document.querySelectorAll(".dropdown, .calendar").forEach((el) => (el.hidden = true));
    form.querySelectorAll(".field__btn[aria-expanded='true']")
      .forEach((b) => b.setAttribute("aria-expanded", "false"));
  };

  /* ============ ПОЛЯ ГОРОДОВ ============ */
  const placeFields = {};
  form.querySelectorAll(".field--place").forEach((field) => {
    const key = field.dataset.place === "origin" ? "origin" : "dest";
    const btn = field.querySelector(".field__btn");
    const valueEl = field.querySelector(".field__value");
    const codeEl = field.querySelector(".field__code");

    // Выпадающий список
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";
    dropdown.hidden = true;
    dropdown.setAttribute("role", "listbox");
    AIRPORTS.forEach((a) => {
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "dropdown__opt";
      opt.setAttribute("role", "option");
      opt.innerHTML = `<b>${a.city}</b>, ${a.airport} <span>${a.code}</span>`;
      opt.addEventListener("click", () => {
        state[key] = a;
        renderPlace(key);
        closeAllPopups();
      });
      dropdown.appendChild(opt);
    });
    field.appendChild(dropdown);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = dropdown.hidden;
      closeAllPopups();
      if (willOpen) {
        // отметить текущий выбор
        const cur = state[key];
        dropdown.querySelectorAll(".dropdown__opt").forEach((o, i) =>
          o.classList.toggle("is-current", cur && AIRPORTS[i].code === cur.code));
        dropdown.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });

    placeFields[key] = { field, valueEl, codeEl };
  });

  const renderPlace = (key) => {
    const { valueEl, codeEl } = placeFields[key];
    const a = state[key];
    if (a) {
      valueEl.textContent = `${a.city}, ${a.airport}`;
      valueEl.classList.remove("field__value--placeholder");
      codeEl.textContent = a.code;
    } else {
      valueEl.textContent = key === "dest" ? "Куда" : "Откуда";
      valueEl.classList.add("field__value--placeholder");
      codeEl.textContent = "";
    }
  };

  /* ============ КАЛЕНДАРЬ ============ */
  const dateFields = {};
  form.querySelectorAll(".field--date").forEach((field) => {
    const key = field.dataset.date === "depart" ? "depart" : "return";
    const btn = field.querySelector(".field__btn");
    const valueEl = field.querySelector(".field__value");
    const placeholder = valueEl.textContent;

    const cal = document.createElement("div");
    cal.className = "calendar" + (key === "return" ? " calendar--right" : "");
    cal.hidden = true;
    cal.setAttribute("role", "dialog");
    cal.addEventListener("click", (e) => e.stopPropagation());
    field.appendChild(cal);

    // вид календаря (год/месяц, который сейчас показан)
    const now = new Date();
    const view = { year: now.getFullYear(), month: now.getMonth() };

    const buildCalendar = () => {
      cal.innerHTML = "";

      // Шапка: год + месяц
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
      yearSel.addEventListener("change", () => { view.year = +yearSel.value; renderDays(); });

      const monthSel = document.createElement("select");
      monthSel.className = "calendar__select calendar__select--month";
      MONTHS_NOM.forEach((m, i) => {
        const o = document.createElement("option");
        o.value = i; o.textContent = "Месяц: " + m;
        if (i === view.month) o.selected = true;
        monthSel.appendChild(o);
      });
      monthSel.addEventListener("change", () => { view.month = +monthSel.value; renderDays(); });

      head.append(yearSel, monthSel);
      cal.appendChild(head);

      // Сетка дней
      const grid = document.createElement("div");
      grid.className = "calendar__grid";
      WEEKDAYS.forEach((w) => {
        const c = document.createElement("div");
        c.className = "calendar__wd"; c.textContent = w;
        grid.appendChild(c);
      });
      cal.appendChild(grid);
      renderDays();

      function renderDays() {
        // обновить «вид» в селектах при смене
        // пересобрать только дни
        grid.querySelectorAll(".calendar__day").forEach((d) => d.remove());
        const first = new Date(view.year, view.month, 1);
        const lead = (first.getDay() + 6) % 7; // понедельник первый
        const daysIn = new Date(view.year, view.month + 1, 0).getDate();
        const sel = state[key];

        for (let i = 0; i < lead; i++) {
          const e = document.createElement("span");
          e.className = "calendar__day is-empty";
          grid.appendChild(e);
        }
        for (let d = 1; d <= daysIn; d++) {
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "calendar__day";
          cell.textContent = d;
          if (sel && sel.year === view.year && sel.month === view.month && sel.day === d) {
            cell.classList.add("is-selected");
          }
          cell.addEventListener("click", () => {
            state[key] = { year: view.year, month: view.month, day: d };
            renderDate(key);
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
        const sel = state[key];
        if (sel) { view.year = sel.year; view.month = sel.month; }
        buildCalendar();
        cal.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });

    dateFields[key] = { valueEl, placeholder };
  });

  const renderDate = (key) => {
    const { valueEl, placeholder } = dateFields[key];
    const d = state[key];
    if (d) {
      valueEl.textContent = `${d.day} ${MONTHS_GEN[d.month]} ${d.year}`;
      valueEl.classList.remove("field__value--placeholder");
    } else {
      valueEl.textContent = placeholder;
      valueEl.classList.add("field__value--placeholder");
    }
  };

  /* ============ SWAP ============ */
  document.getElementById("swap-btn").addEventListener("click", () => {
    [state.origin, state.dest] = [state.dest, state.origin];
    renderPlace("origin");
    renderPlace("dest");
    syncDestInput();
  });

  /* ============ НАЙТИ -> сброс ============ */
  document.getElementById("booking-reset").addEventListener("click", () => {
    state.origin = DEFAULT_ORIGIN;
    state.dest = null;
    state.depart = null;
    state.return = null;
    renderPlace("origin"); renderPlace("dest");
    renderDate("depart"); renderDate("return");
    try { sessionStorage.removeItem("openwing:destination"); } catch (_) {}
    closeAllPopups();
  });

  /* ============ МОСТ ИЗ DIV 1 ============ */
  const destInput = document.getElementById("dest-input");

  const applyDestFromName = (name) => {
    const a = findByCity(name);
    if (a) { state.dest = a; renderPlace("dest"); }
  };
  const syncDestInput = () => {
    if (destInput) destInput.value = state.dest ? state.dest.city : "";
  };

  if (destInput) {
    // клики по городам в div 1 (на этой же странице) выставляют value + change
    destInput.addEventListener("change", () => {
      if (destInput.value) applyDestFromName(destInput.value);
    });
  }

  /* ============ ЗАКРЫТИЕ ПО КЛИКУ МИМО ============ */
  document.addEventListener("click", closeAllPopups);

  /* ============ ИНИЦИАЛИЗАЦИЯ ============ */
  renderPlace("origin");
  renderPlace("dest");
  renderDate("depart");
  renderDate("return");

  // Город, выбранный в div 1 до инициализации формы.
  try {
    const saved = sessionStorage.getItem("openwing:destination");
    if (saved) applyDestFromName(saved);
  } catch (_) {}
});
