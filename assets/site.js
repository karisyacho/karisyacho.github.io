const mobileMenu = document.querySelector(".mobile-menu");
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileMenu.open) {
    mobileMenu.open = false;
    mobileMenu.querySelector("summary").focus();
  }
});
document.addEventListener("click", (event) => {
  if (mobileMenu.open && !mobileMenu.contains(event.target)) mobileMenu.open = false;
});

const filters = document.querySelector(".filters");
if (filters) {
  const buttons = [...filters.querySelectorAll("button")];
  const cards = [...document.querySelectorAll(".work-tile")];
  const status = document.querySelector("[data-filter-status]");
  const dialog = document.querySelector("#project-dialog");
  const projectContent = dialog.querySelector("[data-project-content]");
  let opener;

  filters.hidden = false;
  function filterWorks(button) {
    const category = button.dataset.filter;
    for (const filter of buttons) filter.setAttribute("aria-pressed", String(filter === button));
    for (const card of cards) {
      card.hidden = category !== "all" && !card.dataset.category.split(" ").includes(category);
    }
    status.textContent = `${cards.filter((card) => !card.hidden).length}件の制作実績を表示しています。`;
  }
  for (const button of buttons) button.addEventListener("click", () => filterWorks(button));

  function showProject(card) {
    if (!card) return;
    if (card.hidden) filterWorks(buttons[0]);
    opener = card.querySelector("[data-project-link]");
    projectContent.replaceChildren(card.querySelector("template").content.cloneNode(true));
    if (!dialog.open) dialog.showModal();
  }

  if (typeof dialog.showModal === "function") {
    for (const card of cards) {
      card.querySelector("[data-project-link]").addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        showProject(card);
      });
    }
    dialog.addEventListener("close", () => opener?.focus());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    function openLinkedProject() {
      showProject(cards.find((card) => "#" + card.id === location.hash));
    }
    window.addEventListener("hashchange", openLinkedProject);
    openLinkedProject();
  }
}

const messageForm = document.querySelector("[data-message-form]");
if (messageForm) {
  const result = document.querySelector("[data-message-result]");
  const message = result.querySelector("[data-message-text]");
  const status = result.querySelector("[data-copy-status]");
  const nameField = messageForm.elements.namedItem("name");
  const messageField = messageForm.elements.namedItem("message");

  messageForm.hidden = false;
  for (const field of [nameField, messageField]) {
    field.addEventListener("input", () => field.setCustomValidity(""));
  }
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    for (const field of [nameField, messageField]) {
      if (!field.value.trim()) {
        field.setCustomValidity("空白以外の文字を入力してください。");
        field.reportValidity();
        return;
      }
    }
    const email = messageForm.elements.namedItem("email").value.trim();
    message.value = [
      "AWAI.への制作のご相談",
      "お名前・屋号　" + nameField.value.trim(),
      ...(email ? ["メール　" + email] : []),
      "",
      messageField.value.trim(),
    ].join("\n");
    result.hidden = false;
    status.textContent = "";
    message.focus();
  });

  result.querySelector("[data-copy-message]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(message.value);
      status.textContent = "相談文をコピーしました。DMに貼り付けてください。";
    } catch {
      message.focus();
      message.select();
      status.textContent = "相談文を選択しました。コピーしてDMに貼り付けてください。";
    }
  });
}
