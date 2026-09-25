(() => {
  "use strict";
  const root = document.documentElement,
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s) => document.querySelector(s),
    clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n)),
    smooth = (a, b, x) => {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
  const canvas = $("#cloth-canvas"),
    stage = $(".immersive-stage"),
    story = $(".immersive-scroll");
  let renderer = null;
  try {
    renderer = window.createAimaCloth?.(canvas);
  } catch {
    renderer = null;
  }
  if (renderer) stage.classList.add("has-webgl");
  else {
    canvas.hidden = true;
    $("#ink-drop").hidden = true;
    $("#reset-cloth").hidden = true;
    $(".dye-prompt>span:last-child").textContent = "色を選んで、旅を想像する。";
  }
  root.classList.add("js");
  let manuallyPaused = false;
  try {
    manuallyPaused = localStorage.getItem("aima-motion-v2") === "paused";
  } catch {}
  const moving = () => !manuallyPaused && !reduced.matches;
  function syncMotion() {
    const paused = !moving();
    root.classList.toggle("motion-paused", paused);
    renderer?.setMotion(!paused);
    const button = $("#motion-toggle");
    button.setAttribute("aria-pressed", String(paused));
    button.setAttribute(
      "aria-label",
      reduced.matches
        ? "端末の設定で動きを抑制中"
        : paused
          ? "動きを再開する"
          : "動きを止める",
    );
    button.innerHTML = paused
      ? "▷ <span>動きを再開</span>"
      : "Ⅱ <span>動きを止める</span>";
    button.disabled = reduced.matches;
    if (reduced.matches)
      button.innerHTML = "Ⅱ <span>端末設定で動き抑制中</span>";
    scheduleScroll();
  }
  $("#motion-toggle").addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    try {
      localStorage.setItem(
        "aima-motion-v2",
        manuallyPaused ? "paused" : "playing",
      );
    } catch {}
    syncMotion();
  });
  reduced.addEventListener("change", syncMotion);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") root.classList.add("keyboard-mode");
  });
  document.addEventListener(
    "pointerdown",
    () => root.classList.remove("keyboard-mode"),
    { passive: true },
  );

  const scenes = [$(".scene-intro"), $(".scene-unfold"), $(".scene-arrival")],
    tools = $(".dye-tools"),
    arrival = $(".arrival-photo"),
    stageType = $(".stage-type"),
    shadow = $(".cloth-shadow");
  const manifesto = $(".manifesto"),
    words = [...document.querySelectorAll(".manifesto h2>span")],
    craft = $(".craft-frame"),
    craftImage = $(".craft-frame>img"),
    room = $(".room-window"),
    roomImage = $(".room-window>img"),
    left = $(".window-left"),
    right = $(".window-right");
  let scrollRAF = 0;
  function sceneStyle(el, opacity, y = 0) {
    el.style.opacity = String(opacity);
    el.style.transform = moving() ? `translate3d(0,${y}px,0)` : "none";
    el.setAttribute("aria-hidden", String(opacity < 0.15));
  }
  function updateScroll() {
    scrollRAF = 0;
    const vh = innerHeight;
    const rect = story.getBoundingClientRect();
    const p = clamp(-rect.top / Math.max(1, rect.height - vh));
    stage.dataset.progress = p.toFixed(3);
    renderer?.setProgress(p);
    const first = 1 - smooth(0.12, 0.27, p),
      second = smooth(0.24, 0.38, p) * (1 - smooth(0.54, 0.68, p)),
      third = smooth(0.69, 0.86, p);
    sceneStyle(scenes[0], first, -smooth(0.08, 0.32, p) * 95);
    sceneStyle(scenes[1], second, (1 - smooth(0.24, 0.4, p)) * 80);
    sceneStyle(scenes[2], third, (1 - third) * 65);
    const photo = smooth(0.6, 0.84, p);
    arrival.style.opacity = String(moving() ? photo : p > 0.72 ? 1 : 0);
    arrival.style.transform = moving()
      ? `scale(${1.13 - photo * 0.13})`
      : "none";
    canvas.style.opacity = String(1 - smooth(0.64, 0.84, p));
    stageType.style.transform = moving()
      ? `translate3d(${-p * 130}px,${p * 60}px,0)`
      : "none";
    stageType.style.opacity = String(1 - photo);
    shadow.style.opacity = String(1 - photo);
    const toolsVisible = p < 0.19;
    tools.style.opacity = String(1 - smooth(0.09, 0.19, p));
    tools.inert = !toolsVisible;
    tools.style.visibility = p >= 0.19 ? "hidden" : "visible";
    $(".rail-fill").style.transform = `scaleY(${Math.max(0.02, p)})`;
    $("#chapter-label").textContent =
      p < 0.26
        ? "TOUCH — 01 / 03"
        : p < 0.67
          ? "UNFOLD — 02 / 03"
          : "ARRIVE — 03 / 03";
    $(".stage-footer").style.color = p > 0.72 ? "#fff" : "";
    const mr = manifesto.getBoundingClientRect(),
      mp = clamp((vh - mr.top) / (vh + mr.height));
    words.forEach((word, i) => {
      word.style.transform = moving()
        ? `translate3d(${(i ? 1 : -1) * (1 - smooth(0.08, 0.55, mp)) * 100}px,0,0)`
        : "none";
    });
    const cr = craft.getBoundingClientRect(),
      cp = clamp((vh - cr.top) / (vh + cr.height));
    craftImage.style.transform = moving()
      ? `scale(${1.17 - cp * 0.17}) translate3d(0,${(cp - 0.5) * 30}px,0)`
      : "none";
    const rr = room.getBoundingClientRect(),
      rp = smooth(0.0, 0.85, clamp((vh - rr.top) / vh));
    const open = moving() ? rp : 1;
    left.style.transform = `translate3d(${-open * 101}%,0,0)`;
    right.style.transform = `translate3d(${open * 101}%,0,0)`;
    roomImage.style.transform = moving()
      ? `scale(${1.18 - open * 0.18})`
      : "none";
  }
  function scheduleScroll() {
    if (!scrollRAF) scrollRAF = requestAnimationFrame(updateScroll);
  }
  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll);
  syncMotion();
  $(".scroll-cue").addEventListener("click", (e) => {
    if (Number(stage.dataset.progress) < 0.65) {
      e.preventDefault();
      const destination =
        story.offsetTop + (story.offsetHeight - innerHeight) * 0.44;
      window.scrollTo({
        top: destination,
        behavior: moving() ? "smooth" : "instant",
      });
    }
  });

  const shades = [
    { name: "白藍", roman: "SHIRAAI", color: "#8daebd" },
    { name: "浅葱", roman: "ASAGI", color: "#497f98" },
    { name: "縹", roman: "HANADA", color: "#23448c" },
    { name: "藍", roman: "AI", color: "#172e65" },
    { name: "留紺", roman: "TOMEKON", color: "#131e31" },
  ];
  let selectedShade = shades[2],
    drops = 0,
    lastPaint = 0,
    buttonDrop = 0;
  document.querySelectorAll('input[name="shade"]').forEach((input) =>
    input.addEventListener("change", () => {
      selectedShade = shades[Number(input.value)];
      renderer?.setColor(selectedShade.color);
      $("#shade-name").textContent = selectedShade.name;
      $("#dye-status").textContent = `${selectedShade.name}を選びました。`;
      canvas.dataset.shade = selectedShade.roman;
    }),
  );
  function paint(u, v) {
    renderer?.paint(u, v);
    drops++;
    canvas.dataset.drops = String(drops);
  }
  function paintAt(e) {
    if (
      Number(stage.dataset.progress) > 0.2 ||
      e.target.closest("button,a,input,fieldset")
    )
      return;
    const r = canvas.getBoundingClientRect(),
      nx = ((e.clientX - r.left) / r.width) * 2 - 1,
      ny = 1 - ((e.clientY - r.top) / r.height) * 2,
      aspect = r.width / r.height,
      mobile = aspect < 0.85;
    let x = (nx * aspect * 4.9) / 2.05 - (mobile ? 0 : 0.58),
      y = (ny * 4.9) / 2.05 - (mobile ? 0.13 : 0.06);
    const angle = 0.18,
      xx = x * Math.cos(angle) - y * Math.sin(angle),
      yy = x * Math.sin(angle) + y * Math.cos(angle);
    const u = xx / (mobile ? 2.05 : 4.25) + 0.5,
      v = yy / 3.7 + 0.5;
    renderer?.setPointer(nx, ny);
    if (u < 0.02 || u > 0.98 || v < 0.02 || v > 0.98) return;
    const now = performance.now();
    if (now - lastPaint > 135) {
      paint(u, v);
      lastPaint = now;
    }
  }
  canvas.addEventListener("pointerdown", paintAt, { passive: true });
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "mouse" || e.buttons) paintAt(e);
    },
    { passive: true },
  );
  canvas.addEventListener("pointerleave", () => renderer?.setPointer(0, 0));
  $("#ink-drop").addEventListener("click", () => {
    const spots = [
      [0.42, 0.47],
      [0.66, 0.68],
      [0.28, 0.75],
      [0.73, 0.3],
      [0.4, 0.23],
    ];
    const [u, v] = spots[buttonDrop++ % spots.length];
    paint(u, v);
    $("#dye-status").textContent =
      `布に青を落としました。${drops}回目の染色です。`;
  });
  $("#reset-cloth").addEventListener("click", () => {
    renderer?.reset();
    drops = 0;
    buttonDrop = 0;
    canvas.dataset.drops = "0";
    $("#dye-status").textContent = "布を白に戻しました。";
    $(".canvas-fallback").style.filter = "";
  });

  const menu = $("#mobile-menu"),
    menuButton = $(".menu-toggle");
  function closeMenu(returnFocus = false) {
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "メニューを開く");
    document.body.classList.remove("modal-open");
    $("main").inert = false;
    $("footer").inert = false;
    $("#motion-toggle").inert = false;
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener("click", () => {
    if (!menu.hidden) return closeMenu(true);
    menu.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "メニューを閉じる");
    document.body.classList.add("modal-open");
    $("main").inert = true;
    $("footer").inert = true;
    $("#motion-toggle").inert = true;
    menu.querySelector("a").focus();
  });
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      closeMenu();
      const dest = $(a.getAttribute("href"));
      dest.setAttribute("tabindex", "-1");
      dest.focus({ preventScroll: true });
    }),
  );
  document.addEventListener("keydown", (e) => {
    if (menu.hidden) return;
    if (e.key === "Escape") closeMenu(true);
    if (e.key === "Tab") {
      const links = [menuButton, ...menu.querySelectorAll("a")],
        index = links.indexOf(document.activeElement);
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
  matchMedia("(min-width:701px)").addEventListener("change", (e) => {
    if (e.matches && !menu.hidden) closeMenu();
  });

  const dialog = $("#planner"),
    form = $("#planner-form"),
    dateInput = $("#journey-date"),
    result = $("#plan-result");
  let lastOpener = null,
    itineraryText = "";
  const yen = (n) =>
      new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
      }).format(n),
    localDate = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date(),
    nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  dateInput.min = localDate(today);
  dateInput.value = localDate(nextWeek);
  function getPlan() {
    const data = new FormData(form),
      isStay = data.get("plan") === "stay",
      guests = Number(data.get("guests"));
    return {
      isStay,
      guests,
      date: String(data.get("date")),
      total: (isStay ? 28600 : 6600) * guests,
    };
  }
  function updateEstimate() {
    $("#estimate").textContent = yen(getPlan().total);
  }
  function showForm() {
    form.hidden = false;
    result.hidden = true;
    $(".planner-intro").hidden = false;
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
    renderer?.setMotion(false);
  }
  document
    .querySelectorAll("[data-open-planner]")
    .forEach((b) => b.addEventListener("click", () => openPlanner(b)));
  document
    .querySelectorAll("[data-preset]")
    .forEach((b) =>
      b.addEventListener("click", () => openPlanner(b, b.dataset.preset)),
    );
  $(".dialog-close").addEventListener("click", () => dialog.close());
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
    renderer?.setMotion(moving());
    lastOpener?.focus({ preventScroll: true });
  });
  form.addEventListener("change", updateEstimate);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const plan = getPlan(),
      date = new Date(`${plan.date}T12:00:00`),
      formatted = new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(date),
      title = plan.isStay ? "藍と余白の一泊" : "日帰りのアトリエ";
    const rows = [
      ["過ごし方", title],
      ["出かける日", formatted],
      ["人数", `${plan.guests}名`],
      ["今日選んだ青", `${selectedShade.name} / ${selectedShade.roman}`],
      ["参考料金・税込", yen(plan.total)],
    ];
    const details = $("#result-details");
    details.replaceChildren();
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "result-details-row";
      for (const text of [label, value]) {
        const span = document.createElement("span");
        span.textContent = text;
        row.append(span);
      }
      details.append(row);
    });
    itineraryText = `AIMA — 藍と余白のアトリエ\nあなたの旅のしおり\n\n${rows.map((row) => row.join("：")).join("\n")}\n\n${plan.isStay ? "14:00 お茶でひと息\n15:00 藍染体験（約90分）\n19:00 自由な夜。夕食は含まれません。\n翌08:00 朝食と、近くの散歩\n翌11:00 チェックアウト" : "15:00 藍染体験（約90分）\n16:30 染めた一枚と、帰り道へ"}\n\nAIMAは架空の施設です。これは体験デモであり、予約は成立していません。料金は架空の参考価格です。\nCONCEPT & DESIGN BY AWAI\n`;
    form.hidden = true;
    result.hidden = false;
    $(".planner-intro").hidden = true;
    $("#download-status").textContent = "";
    result.setAttribute("tabindex", "-1");
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: "instant", block: "nearest" });
  });
  $("#edit-plan").addEventListener("click", () => {
    showForm();
    form.querySelector("input:checked").focus();
  });
  $("#download-plan").addEventListener("click", () => {
    const blob = new Blob(["\uFEFF" + itineraryText], {
        type: "text/plain;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "AIMA-旅のしおり.txt";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    $("#download-status").textContent = "しおりのダウンロードを開始しました。";
  });
})();
