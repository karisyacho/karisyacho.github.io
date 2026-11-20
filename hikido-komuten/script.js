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

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const scene = document.getElementById("room-scene");
  const doors = [...document.querySelectorAll(".sliding-door")];
  const handles = [...document.querySelectorAll(".door-handle")];
  const handle = handles[0];
  const returnButton = document.getElementById("door-return");
  const doorStatus = document.getElementById("door-status");
  let amount = 0, gesture = null, cueTimers = [];
  function moveDoor(next) {
    amount = Math.max(0, Math.min(1, next));
    doors.forEach((door, index) => door.style.setProperty("--door-offset", `${amount * 100 * (index ? 1 : -1)}%`));
  }
  function stopCue() {
    cueTimers.forEach(clearTimeout);
    cueTimers = [];
  }
  function settleDoor(open, instant = false) {
    stopCue();
    scene.classList.remove("is-dragging");
    scene.classList.toggle("instant-door", instant);
    moveDoor(open ? 1 : 0);
    scene.classList.toggle("is-open", open);
    handles.forEach((button, index) => {
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "戸を戻す。Enterキー、またはHomeキー" : `${index ? "右" : "左"}の戸をひらく。${index ? "右" : "左"}へドラッグ、または矢印キー`);
    });
    returnButton.hidden = !open;
    if (open && handles.includes(document.activeElement)) returnButton.focus({ preventScroll: true });
    doorStatus.textContent = open ? "左右の戸がひらきました。台所から庭まで続く空間が見えます。" : "左右の戸を戻しました。";
  }
  handles.forEach((button, index) => {
    let suppressClick = false;
    button.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      stopCue();
      scene.classList.remove("instant-door");
      // Start at the visible position, including when interrupting a settling door.
      const matrix = new DOMMatrixReadOnly(getComputedStyle(doors[0]).transform);
      amount = Math.max(0, Math.min(1, -matrix.m41 / doors[0].offsetWidth));
      scene.classList.add("is-dragging");
      moveDoor(amount);
      gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, initial: amount, side: index ? 1 : -1, moved: false, vertical: false };
      suppressClick = false;
      button.setPointerCapture(e.pointerId);
    });
    button.addEventListener("pointermove", (e) => {
      if (!gesture || gesture.id !== e.pointerId) return;
      const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
      if (!gesture.moved && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) gesture.vertical = true;
      if (gesture.vertical) return;
      if (Math.abs(dx) > 5 || gesture.moved) {
        gesture.moved = true;
        moveDoor(gesture.initial + dx * gesture.side / doors[index].offsetWidth);
      }
    });
    function finish(e, cancelled) {
      if (!gesture || gesture.id !== e.pointerId) return;
      const current = gesture;
      gesture = null;
      suppressClick = current.moved || current.vertical || cancelled;
      if (current.moved || cancelled) settleDoor(amount > .45);
      else scene.classList.remove("is-dragging");
    }
    button.addEventListener("pointerup", e => finish(e, false));
    button.addEventListener("pointercancel", e => finish(e, true));
    button.addEventListener("lostpointercapture", e => finish(e, true));
    button.addEventListener("click", e => {
      if (suppressClick && e.detail !== 0) { suppressClick = false; return; }
      settleDoor(amount < .5, e.detail === 0);
    });
    button.addEventListener("keydown", e => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(e.key)) return;
      e.preventDefault();
      settleDoor(e.key === "End" || e.key === (index ? "ArrowRight" : "ArrowLeft"), true);
    });
  });
  returnButton.addEventListener("click", e => {
    settleDoor(false, e.detail === 0);
    handle.focus({ preventScroll: true });
  });
  if (!reducedMotion.matches) {
    cueTimers.push(setTimeout(() => moveDoor(.035), 650));
    cueTimers.push(setTimeout(() => moveDoor(0), 1050));
  }
  reducedMotion.addEventListener("change", () => { stopCue(); settleDoor(amount > .5, true); });

  // Content stays readable by default. Observer adds a one-time entrance only
  // when a section arrives; no opacity gate or scroll interception is needed.
  const sections = document.querySelectorAll(".hero-copy, .thought, .plan-heading, .plan-workspace, .consult-heading, .consult-content, .closing-image");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("has-entered");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .15 });
    sections.forEach(section => observer.observe(section));
  }

  document.querySelectorAll(".plan-after").forEach(group => group.removeAttribute("visibility"));
  document.querySelectorAll("[data-plan]").forEach((button) =>
    button.addEventListener("click", (event) => {
      const after = button.dataset.plan === "after";
      document.querySelectorAll("[data-plan]").forEach((b) => {
        const active = b === button;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      const floorplan = document.querySelector(".floorplan");
      floorplan.classList.toggle("is-after", after);
      floorplan.classList.toggle("plan-instant", event?.detail === 0);
      document.querySelectorAll(".plan-before, .plan-after").forEach(group => group.removeAttribute("visibility"));
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
  let memoTimer;
  function setMemo(open, instant = false) {
    clearTimeout(memoTimer);
    openMemo.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("memo-instant", instant);
    if (open) {
      panel.hidden = false;
      panel.classList.remove("memo-closing");
      panel.inert = false;
      panel.scrollIntoView({ behavior: reducedMotion.matches || instant ? "instant" : "smooth", block: "start" });
      form.elements.problem.focus({ preventScroll: true });
    } else {
      panel.inert = true;
      panel.classList.add("memo-closing");
      openMemo.focus({ preventScroll: true });
      if (reducedMotion.matches || instant) panel.hidden = true;
      else memoTimer = setTimeout(() => { panel.hidden = true; }, 180);
    }
  }
  openMemo.addEventListener("click", e => setMemo(panel.hidden || panel.classList.contains("memo-closing"), e.detail === 0));
  document.getElementById("close-memo").addEventListener("click", e => setMemo(false, e.detail === 0));
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
