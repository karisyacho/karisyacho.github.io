(() => {
  "use strict";
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.getElementById("site-menu");
  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
  }
  menuButton.addEventListener("click", () => {
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    menu.hidden = expanded;
    menuButton.setAttribute("aria-expanded", String(!expanded));
  });
  menu
    .querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !e.target.closest(".site-header")) closeMenu();
  });

  const door = document.getElementById("sliding-door");
  const handle = document.getElementById("door-handle");
  const returnButton = document.getElementById("door-return");
  const doorLabel = document.getElementById("door-label");
  const doorStatus = document.getElementById("door-status");
  let amount = 0,
    startX = 0,
    startAmount = 0,
    pointerId = null,
    moved = false;
  function moveDoor(next) {
    amount = Math.max(0, Math.min(1, next));
    door.style.setProperty("--door-offset", `${-amount * 88}%`);
  }
  function settleDoor(open) {
    door.classList.remove("is-dragging");
    moveDoor(open ? 1 : 0);
    handle.setAttribute("aria-expanded", String(open));
    handle.setAttribute(
      "aria-label",
      open
        ? "戸を戻す。右矢印キーでも閉められます"
        : "戸をひらく。左矢印キーでも開けられます",
    );
    doorLabel.textContent = open ? "戸を戻す" : "戸をひらく";
    document.querySelector(".door-arrow").textContent = open ? "→" : "←";
    returnButton.hidden = !open;
    doorStatus.textContent = open
      ? "戸がひらきました。台所から庭まで続く空間が見えます。"
      : "戸を戻しました。";
  }
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !e.isPrimary) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startAmount = amount;
    moved = false;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    const delta = startX - e.clientX;
    if (Math.abs(delta) > 5) {
      moved = true;
      door.classList.add("is-dragging");
      moveDoor(startAmount + delta / (door.offsetWidth * 0.88));
    }
  });
  handle.addEventListener("pointerup", (e) => {
    if (e.pointerId !== pointerId) return;
    if (moved) settleDoor(amount > 0.4);
    pointerId = null;
  });
  handle.addEventListener("pointercancel", () => {
    pointerId = null;
    settleDoor(amount > 0.5);
  });
  handle.addEventListener("lostpointercapture", () => {
    door.classList.remove("is-dragging");
    pointerId = null;
  });
  handle.addEventListener("click", () => {
    if (moved) {
      moved = false;
      return;
    }
    settleDoor(amount < 0.5);
  });
  handle.addEventListener("keydown", (e) => {
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      e.preventDefault();
      settleDoor(e.key === "ArrowLeft" || e.key === "End");
    }
  });
  returnButton.addEventListener("click", () => {
    settleDoor(false);
    handle.focus({ preventScroll: true });
  });

  document.querySelectorAll("[data-plan]").forEach((button) =>
    button.addEventListener("click", () => {
      const after = button.dataset.plan === "after";
      document.querySelectorAll("[data-plan]").forEach((b) => {
        const active = b === button;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      document
        .querySelectorAll(".plan-before")
        .forEach((g) =>
          g.setAttribute("visibility", after ? "hidden" : "visible"),
        );
      document
        .querySelectorAll(".plan-after")
        .forEach((g) =>
          g.setAttribute("visibility", after ? "visible" : "hidden"),
        );
      document.getElementById("plan-svg-title").textContent = after
        ? "改修後の間取り。間仕切りを取り除き、柱を残す"
        : "改修前の間取り。壁で分かれた台所と居間";
      document.getElementById("plan-caption").textContent = after
        ? "改修後 ── 破線の壁を取り除き、2本の柱を残す。台所と居間が庭につながります。"
        : "改修前 ── 壁で分かれ、台所から庭や居間が見えにくい間取り。";
    }),
  );

  const panel = document.getElementById("memo-panel"),
    openMemo = document.getElementById("open-memo"),
    form = document.getElementById("memo-form");
  const status = document.getElementById("memo-status"),
    storageKey = "hikido-consultation-v1";
  openMemo.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    openMemo.setAttribute("aria-expanded", String(open));
    if (open) {
      panel.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
      form.elements.problem.focus({ preventScroll: true });
    }
  });
  document.getElementById("close-memo").addEventListener("click", () => {
    panel.hidden = true;
    openMemo.setAttribute("aria-expanded", "false");
    openMemo.focus();
  });
  function values() {
    return Object.fromEntries(new FormData(form).entries());
  }
  function memoText() {
    const v = values();
    return `わが家の相談メモ\n\n今、困っていること\n${v.problem || "未記入"}\n\n残したい場所や好きなところ\n${v.keep || "未記入"}\n\n相談したい時期\n${v.timing}\n\n予算の希望\n${v.budget || "未記入"}\n\nひき戸工務店の見本サイトで作った相談用の控えです。外部へは送信されていません。\n`;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === "object") {
      for (const key of ["problem", "keep", "timing", "budget"])
        if (typeof saved[key] === "string")
          form.elements[key].value = saved[key];
      status.textContent = "このブラウザに保存したメモを読み込みました。";
    }
  } catch {
    status.textContent =
      "ブラウザの保存機能を使えません。コピーかダウンロードをご利用ください。";
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(values()));
      status.textContent =
        "このブラウザに保存しました。次に開いたときも読み込めます。外部へは送信していません。";
    } catch {
      status.textContent =
        "保存できませんでした。コピーかダウンロードで控えを残してください。";
    }
  });
  document.getElementById("copy-memo").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(memoText());
      status.textContent =
        "相談メモをコピーしました。相談先へのメッセージなどに貼り付けられます。";
    } catch {
      status.textContent =
        "コピーを使えませんでした。「テキストでダウンロード」で控えを残してください。";
    }
  });
  document.getElementById("download-memo").addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + memoText()], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "わが家の相談メモ.txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent =
      "相談メモのダウンロードを開始しました。端末の保存先をご確認ください。";
  });
  document.getElementById("delete-memo").addEventListener("click", () => {
    try {
      localStorage.removeItem(storageKey);
      form.reset();
      status.textContent =
        "このブラウザに保存したメモを削除しました。入力欄も空にしました。";
    } catch {
      status.textContent =
        "保存したメモを削除できませんでした。ブラウザのサイトデータの設定をご確認ください。";
    }
  });
})();
