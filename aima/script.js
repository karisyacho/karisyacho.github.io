(() => {
  "use strict";
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionButton = document.querySelector("#motion-toggle");
  let manuallyPaused = false;
  try {
    manuallyPaused = localStorage.getItem("aima-motion") === "paused";
  } catch {}
  const motionAllowed = () => !manuallyPaused && !reducedMotion.matches;
  function syncMotion() {
    const paused = !motionAllowed();
    root.classList.toggle("motion-paused", paused);
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.innerHTML = paused
      ? '<span aria-hidden="true">▷</span> 動きを再開する'
      : '<span aria-hidden="true">Ⅱ</span> 動きを止める';
    if (reducedMotion.matches) {
      motionButton.disabled = true;
      motionButton.innerHTML =
        '<span aria-hidden="true">Ⅱ</span> 端末設定で動き抑制中';
    } else motionButton.disabled = false;
    if (paused)
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("is-visible"));
    if (paused)
      document
        .querySelector(".cloth-color")
        .getAnimations()
        .forEach((animation) => animation.cancel());
  }
  syncMotion();
  motionButton.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    try {
      localStorage.setItem(
        "aima-motion",
        manuallyPaused ? "paused" : "playing",
      );
    } catch {}
    syncMotion();
  });
  reducedMotion.addEventListener("change", syncMotion);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") root.classList.add("keyboard-mode");
  });
  document.addEventListener(
    "pointerdown",
    () => root.classList.remove("keyboard-mode"),
    { passive: true },
  );
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -28px 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    root.classList.add("js");
  }

  const menu = document.querySelector("#mobile-menu");
  const menuButton = document.querySelector(".menu-toggle");
  function closeMenu(returnFocus = false) {
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "メニューを開く");
    document.body.classList.remove("modal-open");
    document.querySelector("main").inert = false;
    document.querySelector("footer").inert = false;
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener("click", () => {
    if (!menu.hidden) return closeMenu(true);
    menu.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "メニューを閉じる");
    document.body.classList.add("modal-open");
    document.querySelector("main").inert = true;
    document.querySelector("footer").inert = true;
    menu.querySelector("a").focus();
  });
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      closeMenu();
      const destination = document.querySelector(a.getAttribute("href"));
      destination.setAttribute("tabindex", "-1");
      destination.focus({ preventScroll: true });
    }),
  );
  document.addEventListener("keydown", (e) => {
    if (menu.hidden) return;
    if (e.key === "Escape") closeMenu(true);
    if (e.key === "Tab") {
      const links = [menuButton, ...menu.querySelectorAll("a")];
      const index = links.indexOf(document.activeElement);
      if (e.shiftKey && index <= 0) {
        e.preventDefault();
        links.at(-1).focus();
      } else if (!e.shiftKey && index === links.length - 1) {
        e.preventDefault();
        menuButton.focus();
      } else if (!e.shiftKey && document.activeElement === menuButton) {
        e.preventDefault();
        links[1].focus();
      }
    }
  });
  window.matchMedia("(min-width: 781px)").addEventListener("change", (e) => {
    if (e.matches && !menu.hidden) closeMenu();
  });

  const shades = [
    {
      name: "白藍",
      kana: "しらあい",
      roman: "SHIRAAI",
      color: "#b4d4dc",
      description: "朝の光を、一枚まとって。\n肩の力がすっと抜ける、淡い青。",
    },
    {
      name: "浅葱",
      kana: "あさぎ",
      roman: "ASAGI",
      color: "#6299ae",
      description:
        "水辺を渡る風のように。\n少し遠くへ出かけたくなる、軽やかな青。",
    },
    {
      name: "縹",
      kana: "はなだ",
      roman: "HANADA",
      color: "#315b8b",
      description: "晴れた日の、その向こう。\n気持ちまでひらく、まっすぐな青。",
    },
    {
      name: "藍",
      kana: "あい",
      roman: "AI",
      color: "#20396b",
      description:
        "静けさにも、深さがある。\n自分の心へ帰っていく、落ち着いた青。",
    },
    {
      name: "留紺",
      kana: "とめこん",
      roman: "TOMEKON",
      color: "#192b40",
      description:
        "夜が深まる、その手前。\n言葉にならない気持ちを包む、深い青。",
    },
  ];
  let selectedShade = shades[2];
  let shadeFade;
  const cloth = document.querySelector(".cloth");
  document.querySelectorAll('input[name="shade"]').forEach((input) =>
    input.addEventListener("change", () => {
      document
        .querySelector(".cloth-color-underlay")
        .setAttribute("fill", selectedShade.color);
      shadeFade?.cancel();
      selectedShade = shades[Number(input.value)];
      const name = document.querySelector("#shade-name");
      name.replaceChildren(document.createTextNode(selectedShade.name));
      const kana = document.createElement("span");
      kana.textContent = selectedShade.kana;
      name.append(kana);
      const description = document.querySelector("#shade-description");
      description.replaceChildren();
      selectedShade.description.split("\n").forEach((line, i) => {
        if (i) description.append(document.createElement("br"));
        description.append(document.createTextNode(line));
      });
      document
        .querySelector(".cloth-color")
        .setAttribute("fill", selectedShade.color);
      if (motionAllowed() && !root.classList.contains("keyboard-mode")) {
        shadeFade = document
          .querySelector(".cloth-color")
          .animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 520,
            easing: "cubic-bezier(.22,1,.36,1)",
          });
      }
      document.querySelector("#specimen-roman").textContent =
        selectedShade.roman;
      document.querySelector("#shade-announcement").textContent =
        `${selectedShade.name}、${selectedShade.kana}を選びました。`;
    }),
  );
  const specimen = document.querySelector(".specimen");
  specimen.addEventListener("pointermove", (e) => {
    if (!motionAllowed() || e.pointerType === "touch") return;
    const r = specimen.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cloth.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 4}deg) rotateZ(${x * 1.7}deg)`;
  });
  specimen.addEventListener("pointerleave", () => {
    cloth.style.transform = "";
  });

  const dialog = document.querySelector("#planner");
  const form = document.querySelector("#planner-form");
  const dateInput = document.querySelector("#journey-date");
  const result = document.querySelector("#plan-result");
  let lastOpener = null;
  let itineraryText = "";
  const yen = (amount) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  const localDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const today = new Date();
  dateInput.min = localDate(today);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  dateInput.value = localDate(nextWeek);
  function getPlan() {
    const data = new FormData(form);
    const isStay = data.get("plan") === "stay";
    const guests = Number(data.get("guests"));
    return {
      isStay,
      guests,
      date: String(data.get("date")),
      total: (isStay ? 28600 : 6600) * guests,
    };
  }
  function updateEstimate() {
    document.querySelector("#estimate").textContent = yen(getPlan().total);
  }
  function showForm() {
    form.hidden = false;
    result.hidden = true;
    document.querySelector(".planner-intro").hidden = false;
  }
  function openPlanner(opener, preset) {
    closeMenu();
    lastOpener = opener;
    if (preset) {
      const input = form.querySelector(`input[value="${preset}"]`);
      if (input) input.checked = true;
    }
    showForm();
    updateEstimate();
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add("modal-open");
  }
  document
    .querySelectorAll("[data-open-planner]")
    .forEach((button) =>
      button.addEventListener("click", () => openPlanner(button)),
    );
  document.querySelectorAll("[data-preset]").forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openPlanner(link, link.dataset.preset);
    }),
  );
  document
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastOpener?.focus({ preventScroll: true });
  });
  form.addEventListener("change", updateEstimate);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const plan = getPlan();
    const date = new Date(`${plan.date}T12:00:00`);
    const formattedDate = new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(date);
    const title = plan.isStay ? "藍と余白の一泊" : "日帰りのアトリエ";
    const rows = [
      ["過ごし方", title],
      ["出かける日", formattedDate],
      ["人数", `${plan.guests}名`],
      ["今日選んだ青", `${selectedShade.name} / ${selectedShade.roman}`],
      ["参考料金・税込", yen(plan.total)],
    ];
    const details = document.querySelector("#result-details");
    details.replaceChildren();
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "result-details-row";
      const labelEl = document.createElement("span");
      const valueEl = document.createElement("span");
      labelEl.textContent = label;
      valueEl.textContent = value;
      row.append(labelEl, valueEl);
      details.append(row);
    });
    itineraryText = `AIMA — 藍と余白のアトリエ\nあなたの旅のしおり\n\n${rows.map((row) => row.join("：")).join("\n")}\n\n${plan.isStay ? "14:00 お茶でひと息\n15:00 藍染体験（約90分）\n19:00 自由な夜。夕食はプランに含まれません。\n翌08:00 朝食と、近くの散歩\n翌11:00 チェックアウト" : "15:00 藍染体験（約90分）\n16:30 染めた一枚と、帰り道へ"}\n\nAIMAは架空の施設です。このしおりは体験デモであり、予約は成立していません。料金は架空の参考価格です。\nCONCEPT & DESIGN BY AWAI\n`;
    form.hidden = true;
    result.hidden = false;
    document.querySelector(".planner-intro").hidden = true;
    document.querySelector("#download-status").textContent = "";
    result.setAttribute("tabindex", "-1");
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: "instant", block: "nearest" });
  });
  document.querySelector("#edit-plan").addEventListener("click", () => {
    showForm();
    form.querySelector("input:checked").focus();
  });
  document.querySelector("#download-plan").addEventListener("click", () => {
    const blob = new Blob(["\uFEFF" + itineraryText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AIMA-旅のしおり.txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    document.querySelector("#download-status").textContent =
      "旅のしおりのダウンロードを開始しました。";
  });
})();
