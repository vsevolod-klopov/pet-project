function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveMediaUrl(url) {
  if (!url) {
    return WISH_IMAGE_PLACEHOLDER;
  }
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return url;
}

function updateFilePickerLabel(input, text) {
  const picker = input?.closest(".file-picker");
  const label = picker?.querySelector("[data-file-picker-text]");
  if (!label) return;
  const defaultText = picker.classList.contains("file-picker--multi")
    ? "Добавить фото"
    : "Выбрать изображение";
  label.textContent = text || defaultText;
}

function findGoalById(id) {
  if (!id) return null;
  return (window.APP_DATA?.goals ?? []).find((goal) => goal.id === id) || null;
}

function collectGoalImages(goal) {
  if (!goal) return [];
  const seen = new Set();
  const images = [];

  const add = (src, alt) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    images.push({
      src: resolveMediaUrl(src),
      alt: alt || goal.title,
    });
  };

  (goal.gallery ?? []).forEach((img) => add(img.src, img.alt));
  add(goal.heroImage, goal.heroAlt);
  add(goal.coverImage, goal.coverAlt);

  return images;
}

function resolveGoalStatusId(goal) {
  const steps = goal?.steps ?? [];
  if (steps.length) {
    const last = steps[steps.length - 1];
    if (last.status) return last.status;
  }
  const byLabel = GOAL_STEP_STATUSES.find((item) => item.label === goal?.status);
  return byLabel?.id || "spark";
}

function buildGoalStatusPillHtml(goal) {
  const statusId = resolveGoalStatusId(goal);
  const label = goal?.status || getGoalStepStatusLabel(statusId);
  return `<span class="goal-step-status goal-step-status--${escapeHtml(statusId)}">${escapeHtml(label)}</span>`;
}

function renderGoalSummary(goal) {
  if (!goal) return;

  const statusId = resolveGoalStatusId(goal);
  const label = goal.status || getGoalStepStatusLabel(statusId);
  const pill = document.querySelector("[data-goal-status-pill]");
  if (pill) {
    pill.className = `goal-step-status goal-step-status--${statusId}`;
    pill.textContent = label;
  }

  setText("[data-goal-category]", goal.category || "—");
  setText("[data-goal-horizon]", goal.horizon || "—");
  setText("[data-goal-owners]", goal.owners || "—");
  setText("[data-goal-steps-count]", String((goal.steps ?? []).length));
}

function formatGoalStepDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function normalizeGoalStep(step) {
  if (typeof step === "string") {
    return {
      id: "",
      authorId: null,
      authorName: "Семья",
      authorInitials: "??",
      authorGradient: "base",
      comment: step,
      status: "spark",
      statusLabel: getGoalStepStatusLabel("spark"),
      image: null,
      imageAlt: null,
      createdAt: null,
    };
  }

  return {
    id: step.id || "",
    authorId: step.authorId ?? null,
    authorName: step.authorName || "Семья",
    authorInitials: step.authorInitials || "??",
    authorGradient: step.authorGradient || "base",
    comment: step.comment || "",
    status: step.status || "spark",
    statusLabel: step.statusLabel || getGoalStepStatusLabel(step.status),
    image: step.image || null,
    imageAlt: step.imageAlt || null,
    createdAt: step.createdAt || null,
  };
}

function buildGoalStepCardHtml(step, goalId) {
  const normalized = normalizeGoalStep(step);
  const avatarClass =
    normalized.authorGradient === "alt"
      ? "avatar-circle avatar-circle--alt"
      : "avatar-circle";
  const dateStr = formatGoalStepDate(normalized.createdAt);
  const user = typeof getUser === "function" ? getUser() : null;
  const canDelete =
    normalized.id &&
    user?.id &&
    normalized.authorId === user.id &&
    typeof deleteGoalStep === "function";

  const imageHtml = normalized.image
    ? `<img class="goal-step-image" src="${escapeHtml(resolveMediaUrl(normalized.image))}" alt="${escapeHtml(normalized.imageAlt || normalized.comment)}" loading="lazy" />`
    : "";

  return `
    <article class="goal-step-card">
      <div class="goal-step-header">
        <div class="${avatarClass} goal-step-avatar">${escapeHtml(normalized.authorInitials)}</div>
        <div class="goal-step-header-text">
          <div class="goal-step-author">${escapeHtml(normalized.authorName)}</div>
          <div class="goal-step-meta">
            ${dateStr ? `${escapeHtml(dateStr)} · ` : ""}
            <span class="goal-step-status goal-step-status--${escapeHtml(normalized.status)}">${escapeHtml(normalized.statusLabel)}</span>
          </div>
        </div>
        ${
          canDelete
            ? `<button type="button" class="btn btn--ghost btn--sm btn--danger" data-goal-step-delete="${escapeHtml(normalized.id)}">Удалить</button>`
            : ""
        }
      </div>
      <p class="goal-step-comment">${escapeHtml(normalized.comment)}</p>
      ${imageHtml}
    </article>
  `;
}

function renderGoalStepsFeed(goal, selector) {
  // Рендер ленты шагов цели и повторная привязка обработчиков после каждого обновления DOM.
  const container = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!container || !goal) return;

  const steps = goal.steps ?? [];
  if (!steps.length) {
    container.innerHTML = `<div class="small-muted">Пока нет шагов — добавьте первый, чтобы семья видела путь к цели.</div>`;
    return;
  }

  container.innerHTML = steps.map((step) => buildGoalStepCardHtml(step, goal.id)).join("");

  container.querySelectorAll("[data-goal-step-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const stepId = btn.getAttribute("data-goal-step-delete");
      if (!stepId) return;

      const step = (goal.steps ?? []).find((item) => item.id === stepId);
      const stepLabel = step?.comment || "этот шаг";
      const confirmed = await confirmDelete({
        title: "Удалить шаг?",
        message: `Запись «${stepLabel}» исчезнет из журнала цели. Восстановить её будет нельзя.`,
      });
      if (!confirmed) return;

      try {
        await deleteGoalStep(goal.id, stepId);
        await refreshAppDataIfNeeded();
        const updated = findGoalById(goal.id);
        if (updated) {
          renderGoalStepsFeed(updated, container);
          renderGoalSummary(updated);
          if (document.querySelector("[data-goal-detail]")) {
            renderGoalDetail();
          }
          const detailModal = document.querySelector('[data-modal-backdrop="goal-detail"]');
          if (detailModal && !detailModal.hidden) {
            openGoalDetail(updated);
          }
        }
      } catch (error) {
        console.error("[Delete goal step]", error);
        window.alert(error.message || "Не удалось удалить шаг");
      }
    });
  });
}

function populateGoalStepStatusSelects() {
  document.querySelectorAll("[data-goal-step-status]").forEach((select) => {
    select.innerHTML = GOAL_STEP_STATUSES.map(
      (item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`
    ).join("");
  });
}

function resetGoalStepImagePreview() {
  const preview = document.querySelector("[data-goal-step-image-preview]");
  const fileInput = document.querySelector("[data-goal-step-image-file]");
  if (fileInput) {
    fileInput.value = "";
    updateFilePickerLabel(fileInput, null);
  }
  if (preview) {
    preview.hidden = true;
    preview.innerHTML = "";
  }
}

function showGoalStepImagePreview(src, label) {
  const preview = document.querySelector("[data-goal-step-image-preview]");
  if (!preview) return;
  preview.hidden = false;
  preview.innerHTML = `
    <img src="${escapeHtml(src)}" alt="${escapeHtml(label || "Превью")}" />
    <span class="image-preview-caption">${escapeHtml(label || "Выбранное изображение")}</span>
  `;
}

function openGoalStepModal(goalId) {
  if (!goalId) return;
  const form = document.querySelector("[data-goal-step-form]");
  const errorEl = document.querySelector("[data-goal-step-form-error]");
  if (!form) return;

  form.reset();
  form.elements.goalId.value = goalId;
  if (form.elements.status) {
    form.elements.status.value = GOAL_STEP_STATUSES[0].id;
  }
  resetGoalStepImagePreview();
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }
  openModalById("goal-step");
}

function updateGoalStepButtons(goalId) {
  const authed = typeof isAuthenticated === "function" && isAuthenticated();
  document.querySelectorAll("[data-open-goal-step]").forEach((btn) => {
    btn.hidden = !authed;
    if (goalId) btn.dataset.goalId = goalId;
  });
}

function mountGoalCarousel(root, images) {
  if (!root) return;

  if (!images.length) {
    root.innerHTML = `<div class="small-muted" style="padding: 1.25rem; text-align: center;">Фото пока нет.</div>`;
    return;
  }

  let index = 0;

  const render = () => {
    const image = images[index];
    root.innerHTML = `
      <div class="goal-carousel" data-goal-carousel-root>
        ${
          images.length > 1
            ? `<button type="button" class="goal-carousel-btn goal-carousel-btn--prev" data-goal-carousel-prev aria-label="Предыдущее фото">‹</button>`
            : ""
        }
        <div class="goal-carousel-viewport">
          <img class="goal-carousel-image" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" />
        </div>
        ${
          images.length > 1
            ? `<button type="button" class="goal-carousel-btn goal-carousel-btn--next" data-goal-carousel-next aria-label="Следующее фото">›</button>`
            : ""
        }
        ${
          images.length > 1
            ? `<div class="goal-carousel-dots">${images
                .map(
                  (_, dotIndex) =>
                    `<button type="button" class="goal-carousel-dot${
                      dotIndex === index ? " is-active" : ""
                    }" data-goal-carousel-dot="${dotIndex}" aria-label="Фото ${dotIndex + 1}"></button>`
                )
                .join("")}</div>`
            : ""
        }
      </div>
    `;

    root.querySelector("[data-goal-carousel-prev]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      index = (index - 1 + images.length) % images.length;
      render();
    });
    root.querySelector("[data-goal-carousel-next]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      index = (index + 1) % images.length;
      render();
    });
    root.querySelectorAll("[data-goal-carousel-dot]").forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        index = Number(dot.getAttribute("data-goal-carousel-dot"));
        render();
      });
    });
  };

  render();
}

function openModalById(id) {
  const backdrop = document.querySelector(`[data-modal-backdrop="${id}"]`);
  if (!backdrop) return;
  backdrop.hidden = false;
  document.body.classList.add("no-scroll");
}

let confirmDeleteResolver = null;

function ensureConfirmDeleteModal() {
  // Создаём единое модальное окно подтверждения один раз за сессию.
  // Дальше оно только переиспользуется через confirmDelete(...).
  if (document.querySelector('[data-modal-backdrop="confirm-delete"]')) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal-backdrop" data-modal-backdrop="confirm-delete" hidden>
      <div class="modal modal--confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title">
        <div class="modal-header">
          <div>
            <div class="page-eyebrow">Подтверждение</div>
            <h2 class="modal-title" id="confirm-delete-title" data-confirm-delete-title>Удалить?</h2>
          </div>
        </div>
        <p class="confirm-delete-message" data-confirm-delete-message></p>
        <div class="form-actions confirm-delete-actions">
          <button type="button" class="btn btn--ghost" data-confirm-delete-cancel>Отмена</button>
          <button type="button" class="btn btn--danger" data-confirm-delete-confirm>Удалить</button>
        </div>
      </div>
    </div>
    `
  );

  const backdrop = document.querySelector('[data-modal-backdrop="confirm-delete"]');
  const cancelBtn = backdrop.querySelector("[data-confirm-delete-cancel]");
  const confirmBtn = backdrop.querySelector("[data-confirm-delete-confirm]");

  function finishConfirm(result) {
    backdrop.hidden = true;
    const hasOpenModal = [...document.querySelectorAll("[data-modal-backdrop]")].some(
      (node) => !node.hidden
    );
    if (!hasOpenModal) {
      document.body.classList.remove("no-scroll");
    }
    const resolver = confirmDeleteResolver;
    confirmDeleteResolver = null;
    resolver?.(result);
  }

  cancelBtn.addEventListener("click", () => finishConfirm(false));
  confirmBtn.addEventListener("click", () => finishConfirm(true));
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) finishConfirm(false);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || backdrop.hidden) return;
    finishConfirm(false);
  });
}

function confirmDelete(options = {}) {
  // Promise-обёртка над модальным окном: удобно использовать как await в delete-сценариях.
  ensureConfirmDeleteModal();

  const backdrop = document.querySelector('[data-modal-backdrop="confirm-delete"]');
  const titleEl = backdrop.querySelector("[data-confirm-delete-title]");
  const messageEl = backdrop.querySelector("[data-confirm-delete-message]");
  const confirmBtn = backdrop.querySelector("[data-confirm-delete-confirm]");

  const title = options.title || "Удалить?";
  const message = options.message || "Это действие нельзя отменить.";
  const confirmLabel = options.confirmLabel || "Удалить";

  titleEl.textContent = title;
  messageEl.textContent = message;
  confirmBtn.textContent = confirmLabel;

  backdrop.hidden = false;
  document.body.classList.add("no-scroll");
  confirmBtn.focus();

  return new Promise((resolve) => {
    confirmDeleteResolver = resolve;
  });
}

let goalFormExistingImages = [];
let goalFormPendingFiles = [];
let goalFormPreviewUrls = [];

function resetGoalFormImages() {
  goalFormPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  goalFormPreviewUrls = [];
  goalFormPendingFiles = [];
  goalFormExistingImages = [];

  const preview = document.querySelector("[data-goal-images-preview]");
  if (preview) {
    preview.hidden = true;
    preview.innerHTML = "";
  }

  const fileInput = document.querySelector("[data-goal-images-file]");
  if (fileInput) {
    fileInput.value = "";
    updateFilePickerLabel(fileInput, null);
  }
}

function renderGoalImagesPreview() {
  const grid = document.querySelector("[data-goal-images-preview]");
  if (!grid) return;

  goalFormPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  goalFormPreviewUrls = [];

  const items = [];

  goalFormExistingImages.forEach((image, index) => {
    items.push({
      type: "existing",
      index,
      src: resolveMediaUrl(image.src),
      label: image.alt || "Текущее фото",
    });
  });

  goalFormPendingFiles.forEach((file, index) => {
    const objectUrl = URL.createObjectURL(file);
    goalFormPreviewUrls.push(objectUrl);
    items.push({
      type: "pending",
      index,
      src: objectUrl,
      label: file.name,
    });
  });

  if (!items.length) {
    grid.hidden = true;
    grid.innerHTML = "";
    return;
  }

  grid.hidden = false;
  grid.innerHTML = items
    .map(
      (item) => `
        <div class="file-preview-item">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label)}" />
          <button type="button" class="file-preview-remove" data-goal-image-remove="${item.type}:${item.index}" aria-label="Убрать фото">×</button>
        </div>
      `
    )
    .join("");

  grid.querySelectorAll("[data-goal-image-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const [type, indexValue] = btn.getAttribute("data-goal-image-remove").split(":");
      const index = Number(indexValue);
      if (type === "existing") {
        goalFormExistingImages.splice(index, 1);
      } else {
        goalFormPendingFiles.splice(index, 1);
      }
      renderGoalImagesPreview();
    });
  });
}

let familyWishlistItems = [];

function findWishById(id) {
  if (!id) return null;
  return myWishlist.find((w) => w.id === id) || familyWishlistItems.find((w) => w.id === id);
}

function buildWishTileHtml(wish, options = {}) {
  const { showActions = false, showVisibility = false } = options;
  const price = formatPriceDisplay(wish.budget);
  const category = wish.category ? `<span class="tag-pill">${escapeHtml(wish.category)}</span>` : "";
  const priceHtml = price ? `<div class="wish-tile-price">${escapeHtml(price)}</div>` : "";

  let visibilityHtml = "";
  if (showVisibility) {
    visibilityHtml =
      wish.visibility === "family"
        ? '<span class="tag-pill tag-pill--accent">Видна семье</span>'
        : '<span class="tag-pill">Только я</span>';
  }

  let actionsHtml = "";
  if (showActions) {
    actionsHtml = `
      <div class="wish-tile-actions">
        <button class="btn btn--ghost btn--sm" type="button" data-my-wish-edit="${escapeHtml(wish.id)}">Изменить</button>
        <button class="btn btn--ghost btn--sm btn--danger" type="button" data-my-wish-delete="${escapeHtml(wish.id)}">Удалить</button>
      </div>
    `;
  }

  return `
    <article class="wish-tile" data-wish-view="${escapeHtml(wish.id)}" tabindex="0" role="button" aria-label="${escapeHtml(wish.title)}">
      <div class="wish-tile-media">
        <img src="${escapeHtml(resolveMediaUrl(wish.image))}" alt="${escapeHtml(wish.alt || wish.title)}" loading="lazy" />
      </div>
      <div class="wish-tile-body">
        <h3 class="wish-tile-title">${escapeHtml(wish.title)}</h3>
        ${priceHtml}
        <div class="wish-tile-tags">${category}${visibilityHtml}</div>
      </div>
      ${actionsHtml}
    </article>
  `;
}

function bindWishTileInteractions(grid, options = {}) {
  if (!grid) return;

  grid.querySelectorAll("[data-wish-view]").forEach((tile) => {
    tile.addEventListener("click", (e) => {
      if (e.target.closest("[data-my-wish-edit], [data-my-wish-delete]")) return;
      const id = tile.getAttribute("data-wish-view");
      const wish = findWishById(id);
      if (wish) openWishDetail(wish);
    });
    tile.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const id = tile.getAttribute("data-wish-view");
      const wish = findWishById(id);
      if (wish) openWishDetail(wish);
    });
  });

  if (options.manageActions) {
    grid.querySelectorAll("[data-my-wish-edit]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openMyWishForEdit(btn.getAttribute("data-my-wish-edit"));
      });
    });
    grid.querySelectorAll("[data-my-wish-delete]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteMyWish(btn.getAttribute("data-my-wish-delete"));
      });
    });
  }
}

function ensureWishDetailModal() {
  if (document.querySelector('[data-modal-backdrop="wish-detail"]')) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal-backdrop" data-modal-backdrop="wish-detail" hidden>
      <div class="modal modal--wish-detail" role="dialog" aria-modal="true" aria-labelledby="wish-detail-title">
        <div class="modal-header">
          <div>
            <div class="page-eyebrow">Хотелка</div>
            <h2 class="modal-title" id="wish-detail-title" data-wish-detail-title></h2>
          </div>
          <button class="modal-close" type="button" data-close-modal="wish-detail" aria-label="Закрыть">×</button>
        </div>
        <div class="wish-detail">
          <div class="wish-detail-media">
            <img data-wish-detail-image alt="" />
          </div>
          <div class="wish-detail-info">
            <p class="wish-detail-description" data-wish-detail-description></p>
            <dl class="wish-detail-meta">
              <div data-wish-detail-price-row hidden>
                <dt>Цена</dt>
                <dd data-wish-detail-price></dd>
              </div>
              <div data-wish-detail-category-row hidden>
                <dt>Категория</dt>
                <dd data-wish-detail-category></dd>
              </div>
              <div data-wish-detail-visibility-row hidden>
                <dt>Видимость</dt>
                <dd data-wish-detail-visibility></dd>
              </div>
            </dl>
            <div class="form-field" data-wish-detail-link-block hidden>
              <label class="form-label" for="wish-detail-link-input">Ссылка на товар</label>
              <div class="share-copy-row">
                <input class="form-input" id="wish-detail-link-input" type="text" readonly data-wish-detail-link />
                <button type="button" class="btn btn--ghost" data-wish-detail-copy-link>Копировать</button>
                <a class="btn btn--primary" data-wish-detail-open-link href="#" target="_blank" rel="noreferrer">Открыть</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `
  );

  const copyBtn = document.querySelector("[data-wish-detail-copy-link]");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const input = document.querySelector("[data-wish-detail-link]");
      if (!input?.value) return;
      try {
        await copyTextToClipboard(input.value);
        flashCopyButton(copyBtn);
      } catch (error) {
        console.error("[Copy wish link]", error);
        flashCopyButton(copyBtn, "Ошибка");
      }
    });
  }
}

function fitWishDetailImage(img) {
  if (!img) return;

  const run = () => {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;

    const isMobile = window.innerWidth <= 720;
    const maxW = isMobile
      ? Math.min(window.innerWidth - 56, nw)
      : Math.min(window.innerWidth * 0.5, 540, nw);
    const maxH = Math.min(window.innerHeight * 0.72, 600, nh);
    const scale = Math.min(maxW / nw, maxH / nh, 1);

    img.style.width = `${Math.round(nw * scale)}px`;
    img.style.height = `${Math.round(nh * scale)}px`;
  };

  if (img.complete && img.naturalWidth) {
    run();
  } else {
    img.onload = () => run();
  }
}

function openWishDetail(wish) {
  if (!wish) return;

  ensureWishDetailModal();

  const backdrop = document.querySelector('[data-modal-backdrop="wish-detail"]');
  const titleEl = document.querySelector("[data-wish-detail-title]");
  const imageEl = document.querySelector("[data-wish-detail-image]");
  const descEl = document.querySelector("[data-wish-detail-description]");
  const priceRow = document.querySelector("[data-wish-detail-price-row]");
  const priceEl = document.querySelector("[data-wish-detail-price]");
  const categoryRow = document.querySelector("[data-wish-detail-category-row]");
  const categoryEl = document.querySelector("[data-wish-detail-category]");
  const visibilityRow = document.querySelector("[data-wish-detail-visibility-row]");
  const visibilityEl = document.querySelector("[data-wish-detail-visibility]");
  const linkBlock = document.querySelector("[data-wish-detail-link-block]");
  const linkInput = document.querySelector("[data-wish-detail-link]");
  const openLink = document.querySelector("[data-wish-detail-open-link]");

  if (titleEl) titleEl.textContent = wish.title || "";
  if (imageEl) {
    imageEl.onload = null;
    imageEl.style.width = "";
    imageEl.style.height = "";
    imageEl.src = resolveMediaUrl(wish.image);
    imageEl.alt = wish.alt || wish.title || "";
    fitWishDetailImage(imageEl);
  }

  if (descEl) {
    const text = (wish.description || "").trim();
    descEl.textContent = text;
    descEl.hidden = !text;
  }

  const price = formatPriceDisplay(wish.budget);
  if (priceRow && priceEl) {
    priceRow.hidden = !price;
    priceEl.textContent = price;
  }

  if (categoryRow && categoryEl) {
    categoryRow.hidden = !wish.category;
    categoryEl.textContent = wish.category || "";
  }

  if (visibilityRow && visibilityEl) {
    const hasVisibility = wish.visibility != null;
    visibilityRow.hidden = !hasVisibility;
    visibilityEl.textContent =
      wish.visibility === "family" ? "Видна семье" : wish.visibility === "private" ? "Только я" : "";
  }

  const link = (wish.link || "").trim();
  if (linkBlock && linkInput && openLink) {
    linkBlock.hidden = !link;
    linkInput.value = link;
    openLink.href = link;
  }

  if (backdrop) {
    backdrop.hidden = false;
    document.body.classList.add("no-scroll");
  }
}

function ensureGoalDetailModal() {
  if (document.querySelector('[data-modal-backdrop="goal-detail"]')) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal-backdrop" data-modal-backdrop="goal-detail" hidden>
      <div class="modal modal--goal-detail" role="dialog" aria-modal="true" aria-labelledby="goal-detail-title">
        <div class="modal-header">
          <div>
            <div class="page-eyebrow">Общая цель</div>
            <h2 class="modal-title" id="goal-detail-title" data-goal-detail-title></h2>
          </div>
          <button class="modal-close" type="button" data-close-modal="goal-detail" aria-label="Закрыть">×</button>
        </div>
        <div class="goal-detail-body">
          <div data-goal-detail-carousel></div>
          <p class="wish-detail-description" data-goal-detail-description></p>
          <dl class="goal-detail-meta-grid">
            <div>
              <dt>Категория</dt>
              <dd data-goal-detail-category></dd>
            </div>
            <div>
              <dt>Горизонт</dt>
              <dd data-goal-detail-horizon></dd>
            </div>
            <div>
              <dt>Статус</dt>
              <dd data-goal-detail-status></dd>
            </div>
          </dl>
          <div class="goal-detail-steps-block">
            <div class="goal-steps-header">
              <h3 class="section-title" style="font-size: 1rem; margin: 0">Шаги семьи</h3>
            </div>
            <div class="goal-steps-feed" data-goal-detail-steps></div>
          </div>
          <div class="card-goal-actions" data-goal-detail-actions hidden>
            <button type="button" class="btn btn--ghost btn--sm" data-goal-detail-edit>Изменить</button>
            <button type="button" class="btn btn--ghost btn--sm btn--danger" data-goal-detail-delete>Удалить</button>
            <a class="btn btn--ghost btn--sm" data-goal-detail-page href="#">Открыть отдельной страницей</a>
          </div>
        </div>
      </div>
    </div>
    `
  );

  document.querySelector("[data-goal-detail-edit]")?.addEventListener("click", () => {
    const goalId = document.querySelector('[data-modal-backdrop="goal-detail"]')?.dataset.currentGoalId;
    if (!goalId) return;
    const backdrop = document.querySelector('[data-modal-backdrop="goal-detail"]');
    if (backdrop) backdrop.hidden = true;
    openGoalForEdit(goalId);
  });

  document.querySelector("[data-goal-detail-delete]")?.addEventListener("click", () => {
    const goalId = document.querySelector('[data-modal-backdrop="goal-detail"]')?.dataset.currentGoalId;
    if (goalId) handleDeleteGoal(goalId);
  });
}

function openGoalDetail(goal) {
  if (!goal) return;

  ensureGoalDetailModal();

  const backdrop = document.querySelector('[data-modal-backdrop="goal-detail"]');
  const titleEl = document.querySelector("[data-goal-detail-title]");
  const descEl = document.querySelector("[data-goal-detail-description]");
  const categoryEl = document.querySelector("[data-goal-detail-category]");
  const horizonEl = document.querySelector("[data-goal-detail-horizon]");
  const statusEl = document.querySelector("[data-goal-detail-status]");
  const actionsEl = document.querySelector("[data-goal-detail-actions]");
  const pageLink = document.querySelector("[data-goal-detail-page]");
  const carouselRoot = document.querySelector("[data-goal-detail-carousel]");
  const stepsRoot = document.querySelector("[data-goal-detail-steps]");

  if (backdrop) {
    backdrop.dataset.currentGoalId = goal.id;
  }

  if (titleEl) titleEl.textContent = goal.title || "";
  if (descEl) {
    const text = (goal.description || []).join("\n\n").trim() || (goal.short || "").trim();
    descEl.textContent = text;
    descEl.hidden = !text;
  }
  if (categoryEl) categoryEl.textContent = goal.category || "—";
  if (horizonEl) horizonEl.textContent = goal.horizon || "—";
  if (statusEl) statusEl.innerHTML = buildGoalStatusPillHtml(goal);

  const authed = typeof isAuthenticated === "function" && isAuthenticated();
  if (actionsEl) {
    actionsEl.hidden = !authed;
  }
  if (pageLink) {
    pageLink.href = routeUrl(APP_ROUTES.goalDetail, { id: goal.id });
  }

  updateGoalStepButtons(goal.id);
  renderGoalStepsFeed(goal, stepsRoot);
  mountGoalCarousel(carouselRoot, collectGoalImages(goal));

  if (backdrop) {
    backdrop.hidden = false;
    document.body.classList.add("no-scroll");
  }
}

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = text;
}

function setHtml(selector, html) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML = html;
}

let closeMobileNavPanel = () => {};

function initMobileNav() {
  const toggle = document.querySelector(".menu-toggle");
  const panel = document.querySelector(".mobile-nav");
  const overlay = document.querySelector(".mobile-nav-overlay");
  const closeBtn = document.querySelector("[data-mobile-nav-close]");

  if (!toggle || !panel || !overlay || !closeBtn) return;

  function open() {
    panel.hidden = false;
    overlay.hidden = false;
    document.body.classList.add("no-scroll");
    toggle.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
  }

  function close() {
    panel.hidden = true;
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
    toggle.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
  }

  closeMobileNavPanel = close;

  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "mobile-nav");
  panel.setAttribute("id", "mobile-nav");
  panel.setAttribute("aria-hidden", "true");

  toggle.addEventListener("click", () => {
    if (panel.hidden) open();
    else close();
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function buildUserInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 4);
  }
  return String(name || "")
    .trim()
    .slice(0, 2)
    .toUpperCase() || "??";
}

function getFamilyMemberForCurrentUser() {
  const user = typeof getUser === "function" ? getUser() : null;
  if (!user?.id) return null;
  return (window.APP_DATA?.family ?? []).find((member) => member.userId === user.id) || null;
}

function normalizeNavPath(pathname) {
  const decoded = decodeURIComponent(pathname || "/");
  return decoded.replace(/\/+$/, "") || "/";
}

function isHomePath(pathname) {
  const path = normalizeNavPath(pathname);
  return path === "/" || path === normalizeNavPath(APP_ROUTES.home);
}

function isNavPathActive(href) {
  try {
    const path = normalizeNavPath(new URL(href, window.location.origin).pathname);
    const current = normalizeNavPath(window.location.pathname);

    if (isHomePath(path) && isHomePath(current)) {
      return true;
    }

    if (current === path) {
      return true;
    }

    if (path === normalizeNavPath(APP_ROUTES.goals) && current === normalizeNavPath(APP_ROUTES.goalDetail)) {
      return true;
    }

    if (path === normalizeNavPath(APP_ROUTES.family) && current === normalizeNavPath(APP_ROUTES.wishlist)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function navLinkClass(href) {
  const classes = ["nav-link"];
  if (isNavPathActive(href)) classes.push("nav-link--primary");
  return classes.join(" ");
}

function navLinkAttrs(href) {
  return isNavPathActive(href) ? ' aria-current="page"' : "";
}

function mobileNavLinkClass(href) {
  const classes = ["mobile-nav-link"];
  if (isNavPathActive(href)) classes.push("mobile-nav-link--primary");
  return classes.join(" ");
}

function mobileNavLinkAttrs(href) {
  return isNavPathActive(href) ? ' aria-current="page"' : "";
}

function renderHeaderBrand() {
  const logo = document.querySelector(".logo");
  if (!logo) return;

  const authed = typeof isAuthenticated === "function" && isAuthenticated();
  if (!authed) return;

  const user = typeof getUser === "function" ? getUser() : null;
  const member = getFamilyMemberForCurrentUser();
  const name = user?.name || "Аккаунт";
  const initials = member?.initials || buildUserInitials(name);
  const avatarClass =
    member?.gradient === "alt" ? "avatar-circle avatar-circle--alt" : "avatar-circle";

  const brand = document.createElement("div");
  brand.className = "header-brand header-brand--user";
  brand.setAttribute("aria-label", `Вы вошли как ${name}`);
  brand.innerHTML = `
    <div class="${avatarClass} header-user-avatar">${escapeHtml(initials)}</div>
    <div class="header-user-text">
      <div class="header-user-name">${escapeHtml(name)}</div>
      <div class="header-user-sub">Домашняя карта желаний</div>
    </div>
  `;
  logo.replaceWith(brand);
}

function renderDesktopNav() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const authed = typeof isAuthenticated === "function" && isAuthenticated();

  if (authed) {
    nav.innerHTML = `
      <a class="${navLinkClass(APP_ROUTES.goals)}" href="${APP_ROUTES.goals}"${navLinkAttrs(APP_ROUTES.goals)}>Общие цели</a>
      <a class="${navLinkClass(APP_ROUTES.family)}" href="${APP_ROUTES.family}"${navLinkAttrs(APP_ROUTES.family)}>Список семьи</a>
      <a class="${navLinkClass(APP_ROUTES.myWishlist)}" href="${APP_ROUTES.myWishlist}"${navLinkAttrs(APP_ROUTES.myWishlist)}>Мои хотелки</a>
      <button type="button" class="nav-link" data-logout-btn>Выйти</button>
    `;
    nav.querySelector("[data-logout-btn]")?.addEventListener("click", () => {
      if (typeof logout === "function") logout();
    });
    return;
  }

  nav.innerHTML = `
    <a class="${navLinkClass(APP_ROUTES.login)}" href="${APP_ROUTES.login}"${navLinkAttrs(APP_ROUTES.login)}>Войти</a>
    <a class="${navLinkClass(APP_ROUTES.register)}" href="${APP_ROUTES.register}"${navLinkAttrs(APP_ROUTES.register)}>Регистрация</a>
  `;
}

function renderMobileNavFamilySection() {
  const family = window.APP_DATA?.family ?? [];
  if (!family.length) return "";

  const links = family
    .map((member) => {
      const href = routeUrl(APP_ROUTES.wishlist, { id: member.id });
      const avatarClass =
        member.gradient === "alt"
          ? "mobile-nav-sub-avatar mobile-nav-sub-avatar--alt"
          : "mobile-nav-sub-avatar";
      return `
        <a class="mobile-nav-sub-link" href="${escapeHtml(href)}">
          <span class="${avatarClass}">${escapeHtml(member.initials || buildUserInitials(member.name))}</span>
          <span class="mobile-nav-sub-text">${escapeHtml(member.name)}</span>
        </a>
      `;
    })
    .join("");

  return `
    <div class="mobile-nav-section">
      <div class="mobile-nav-section-title">Хотелки семьи</div>
      <div class="mobile-nav-sub-links">${links}</div>
    </div>
  `;
}

function renderMobileNav() {
  const panel = document.querySelector(".mobile-nav");
  if (!panel) return;

  const top = panel.querySelector(".mobile-nav-top");
  if (!top) return;

  const authed = typeof isAuthenticated === "function" && isAuthenticated();
  const user = typeof getUser === "function" ? getUser() : null;
  const member = getFamilyMemberForCurrentUser();
  const name = user?.name || "Аккаунт";
  const initials = member?.initials || buildUserInitials(name);
  const avatarClass =
    member?.gradient === "alt" ? "avatar-circle avatar-circle--alt" : "avatar-circle";

  let bodyHtml = "";

  if (authed) {
    bodyHtml = `
      <div class="mobile-nav-body">
        <div class="mobile-nav-user-card">
          <div class="${avatarClass} mobile-nav-user-avatar">${escapeHtml(initials)}</div>
          <div class="mobile-nav-user-text">
            <div class="mobile-nav-user-name">${escapeHtml(name)}</div>
            <div class="mobile-nav-user-meta">${escapeHtml(member?.subtitle || "Ваша семья")}</div>
          </div>
        </div>
        <nav class="mobile-nav-links" aria-label="Навигация (мобильная)">
          <a class="${mobileNavLinkClass(APP_ROUTES.goals)}" href="${APP_ROUTES.goals}"${mobileNavLinkAttrs(APP_ROUTES.goals)}>Общие цели</a>
          <a class="${mobileNavLinkClass(APP_ROUTES.family)}" href="${APP_ROUTES.family}"${mobileNavLinkAttrs(APP_ROUTES.family)}>Список семьи</a>
          <a class="${mobileNavLinkClass(APP_ROUTES.myWishlist)}" href="${APP_ROUTES.myWishlist}"${mobileNavLinkAttrs(APP_ROUTES.myWishlist)}>Мои хотелки</a>
        </nav>
        ${renderMobileNavFamilySection()}
      </div>
      <div class="mobile-nav-footer">
        <button type="button" class="mobile-nav-link mobile-nav-link--ghost" data-logout-btn-mobile>Выйти</button>
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="mobile-nav-body">
        <div class="mobile-nav-guest-card">
          <div class="logo-mark mobile-nav-guest-mark">W</div>
          <div>
            <div class="mobile-nav-guest-title">Домашняя карта желаний</div>
            <div class="mobile-nav-guest-sub">Войдите, чтобы синхронизировать данные</div>
          </div>
        </div>
        <nav class="mobile-nav-links" aria-label="Навигация (мобильная)">
          <a class="${mobileNavLinkClass(APP_ROUTES.home)}" href="${APP_ROUTES.home}"${mobileNavLinkAttrs(APP_ROUTES.home)}>Главная</a>
          <a class="${mobileNavLinkClass(APP_ROUTES.login)}" href="${APP_ROUTES.login}"${mobileNavLinkAttrs(APP_ROUTES.login)}>Войти</a>
          <a class="${mobileNavLinkClass(APP_ROUTES.register)}" href="${APP_ROUTES.register}"${mobileNavLinkAttrs(APP_ROUTES.register)}>Регистрация</a>
        </nav>
      </div>
    `;
  }

  panel.querySelectorAll(":scope > :not(.mobile-nav-top)").forEach((node) => node.remove());
  top.insertAdjacentHTML("afterend", bodyHtml);

  panel.querySelector("[data-logout-btn-mobile]")?.addEventListener("click", () => {
    closeMobileNavPanel();
    if (typeof logout === "function") logout();
  });

  panel.querySelectorAll("a.mobile-nav-link, a.mobile-nav-sub-link").forEach((link) => {
    link.addEventListener("click", () => closeMobileNavPanel());
  });
}

function renderHomeActions() {
  // На главной для гостя показываем призыв войти/зарегистрироваться,
  // а не ссылки на защищённые страницы (иначе клик ведёт на логин).
  const actions = document.querySelector("[data-home-actions]");
  if (!actions) return;

  const authed = typeof isAuthenticated === "function" && isAuthenticated();
  if (authed) {
    actions.innerHTML = `
      <a href="${APP_ROUTES.goals}" class="btn btn--primary">К общим целям</a>
      <a href="${APP_ROUTES.family}" class="btn btn--ghost">Смотреть хотелки семьи</a>
    `;
    actions.hidden = false;
    return;
  }

  // Для гостя — один заметный CTA в hero (вход/регистрация остаются в шапке).
  actions.innerHTML = `
    <a href="${APP_ROUTES.register}" class="btn btn--primary">Создать семью</a>
    <a href="${APP_ROUTES.login}" class="btn btn--ghost">У меня уже есть аккаунт</a>
  `;
  actions.hidden = false;
}

function initHeaderNav() {
  renderHeaderBrand();
  renderDesktopNav();
  renderMobileNav();
  renderHomeActions();
}

function initModals() {
  function openModal(id) {
    const backdrop = document.querySelector(`[data-modal-backdrop="${id}"]`);
    if (!backdrop) return;
    backdrop.hidden = false;
    document.body.classList.add("no-scroll");
  }

  function closeModal(id) {
    const backdrop = document.querySelector(`[data-modal-backdrop="${id}"]`);
    if (!backdrop) return;
    backdrop.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    const id = btn.getAttribute("data-open-modal");
    if (!id) return;
    btn.addEventListener("click", () => openModal(id));
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    const id = btn.getAttribute("data-close-modal");
    if (!id) return;
    btn.addEventListener("click", () => closeModal(id));
  });

  document.querySelectorAll("[data-modal-backdrop]").forEach((backdrop) => {
    if (backdrop.getAttribute("data-modal-backdrop") === "confirm-delete") return;
    backdrop.addEventListener("click", (e) => {
      if (e.target !== backdrop) return;
      const id = backdrop.getAttribute("data-modal-backdrop");
      closeModal(id);
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelectorAll("[data-modal-backdrop]").forEach((backdrop) => {
      if (backdrop.getAttribute("data-modal-backdrop") === "confirm-delete") return;
      if (!backdrop.hidden) {
        const id = backdrop.getAttribute("data-modal-backdrop");
        closeModal(id);
      }
    });
  });
}

function renderGoalsList() {
  const grid = document.querySelector("[data-goals-grid]");
  if (!grid) return;

  const goals = window.APP_DATA?.goals ?? [];
  const authed = typeof isAuthenticated === "function" && isAuthenticated();

  const html = goals
    .map((g) => {
      const chipClass = g.category === "Путешествия" ? "chip chip--accent" : "chip";
      const actionsHtml = authed
        ? `
          <div class="card-goal-actions">
            <button class="btn btn--ghost btn--sm" type="button" data-goal-edit="${escapeHtml(g.id)}">Изменить</button>
            <button class="btn btn--ghost btn--sm btn--danger" type="button" data-goal-delete="${escapeHtml(g.id)}">Удалить</button>
          </div>
        `
        : "";

      const categoryHtml = g.category
        ? `<div class="card-media-tag"><span class="${chipClass}">${escapeHtml(g.category)}</span></div>`
        : "";
      const horizonHtml = g.horizon
        ? `<p class="card-meta">Горизонт: ${escapeHtml(g.horizon)}</p>`
        : "";
      const shortHtml = g.short ? `<p class="card-text">${escapeHtml(g.short)}</p>` : "";

      return `
        <article class="card card--goal" data-goal-view="${escapeHtml(g.id)}">
          <div class="card-media">
            <img src="${escapeHtml(resolveMediaUrl(g.coverImage))}" alt="${escapeHtml(g.coverAlt || g.title)}" loading="lazy" />
            ${categoryHtml}
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <h3 class="card-title">${escapeHtml(g.title)}</h3>
            </div>
            ${horizonHtml}
            <div class="goal-card-status">${buildGoalStatusPillHtml(g)}</div>
            ${shortHtml}
            <div class="card-footer">
              <button type="button" class="card-link card-link--btn" data-goal-open="${escapeHtml(g.id)}">Открыть подробности →</button>
            </div>
            ${actionsHtml}
          </div>
        </article>
      `;
    })
    .join("");

  grid.innerHTML =
    html || `<div class="small-muted">Пока нет общих целей — добавьте первую.</div>`;

  bindGoalCardInteractions(grid);
}

function bindGoalCardInteractions(grid) {
  if (!grid) return;

  grid.querySelectorAll("[data-goal-view]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-goal-edit], [data-goal-delete], [data-goal-open]")) return;
      const goal = findGoalById(card.getAttribute("data-goal-view"));
      if (goal) openGoalDetail(goal);
    });
  });

  grid.querySelectorAll("[data-goal-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const goal = findGoalById(btn.getAttribute("data-goal-open"));
      if (goal) openGoalDetail(goal);
    });
  });

  grid.querySelectorAll("[data-goal-edit]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openGoalForEdit(btn.getAttribute("data-goal-edit"));
    });
  });

  grid.querySelectorAll("[data-goal-delete]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleDeleteGoal(btn.getAttribute("data-goal-delete"));
    });
  });
}

function renderGoalDetail() {
  const root = document.querySelector("[data-goal-detail]");
  if (!root) return;

  const id = getQueryParam("id") || (window.APP_DATA?.goals ?? [])[0]?.id;
  const goals = window.APP_DATA?.goals ?? [];
  const goal = goals.find((g) => g.id === id) ?? goals[0];
  if (!goal) return;

  root.dataset.goalId = goal.id;
  document.title = `${goal.title} · Детальная цель`;
  setText("[data-goal-title]", goal.title);
  setText("[data-goal-subtitle]", "Коллаж, описание и записи семьи на пути к цели.");

  mountGoalCarousel(document.querySelector("[data-goal-carousel]"), collectGoalImages(goal));

  const descHtml = (goal.description ?? [])
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
  setHtml("[data-goal-description]", descHtml || `<p class="small-muted">Описание пока не добавлено.</p>`);

  renderGoalStepsFeed(goal, "[data-goal-steps]");
  updateGoalStepButtons(goal.id);
  renderGoalSummary(goal);
}

function initGoalStepForm() {
  const form = document.querySelector("[data-goal-step-form]");
  if (!form) return;

  populateGoalStepStatusSelects();

  document.querySelectorAll("[data-open-goal-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const goalId =
        btn.dataset.goalId ||
        document.querySelector("[data-goal-detail]")?.dataset.goalId ||
        document.querySelector('[data-modal-backdrop="goal-detail"]')?.dataset.currentGoalId;
      openGoalStepModal(goalId);
    });
  });

  const fileInput = document.querySelector("[data-goal-step-image-file]");
  const errorEl = document.querySelector("[data-goal-step-form-error]");

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      updateFilePickerLabel(fileInput, file ? file.name : null);
      if (!file) {
        resetGoalStepImagePreview();
        return;
      }
      showGoalStepImagePreview(URL.createObjectURL(file), file.name);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const goalId = form.elements.goalId.value;
    const comment = form.elements.comment.value.trim();
    const status = form.elements.status.value;
    const file = fileInput?.files?.[0];

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    if (!goalId) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = "Не удалось определить цель";
      }
      return;
    }

    if (!comment) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = "Напишите комментарий к шагу";
      }
      return;
    }

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Сохранение...";

    try {
      const payload = { comment, status };
      if (file) {
        const uploaded = await uploadGoalImage(file);
        payload.image = uploaded.url;
        payload.imageAlt = uploaded.alt || comment;
      }

      await createGoalStep(goalId, payload);
      await refreshAppDataIfNeeded();

      const updated = findGoalById(goalId);
      if (updated) {
        renderGoalStepsFeed(updated, "[data-goal-steps]");
        renderGoalStepsFeed(updated, "[data-goal-detail-steps]");
        if (document.querySelector("[data-goal-detail]")) {
          renderGoalDetail();
        }
        const detailModal = document.querySelector('[data-modal-backdrop="goal-detail"]');
        if (detailModal && !detailModal.hidden) {
          openGoalDetail(updated);
        }
      }

      form.reset();
      form.elements.goalId.value = goalId;
      resetGoalStepImagePreview();

      const backdrop = document.querySelector('[data-modal-backdrop="goal-step"]');
      if (backdrop) backdrop.hidden = true;
      document.body.classList.remove("no-scroll");
    } catch (error) {
      console.error("[Save goal step]", error);
      window.alert(error.message || "Не удалось сохранить шаг");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

function openGoalForEdit(goalId) {
  const goal = findGoalById(goalId);
  const form = document.querySelector("[data-goal-form]");
  const errorEl = document.querySelector("[data-goal-form-error]");
  const titleEl = document.querySelector("#goal-modal-title");
  if (!goal || !form) return;

  form.elements.id.value = goal.id;
  form.elements.title.value = goal.title || "";
  form.elements.horizon.value = goal.horizon || "";
  if (form.elements.category) {
    form.elements.category.value = goal.category || "Другое";
  }
  form.elements.description.value = (goal.description || []).join("\n\n") || goal.short || "";

  goalFormExistingImages = (goal.gallery ?? []).map((image) => ({
    src: image.src,
    alt: image.alt || goal.title,
  }));
  if (!goalFormExistingImages.length && goal.coverImage) {
    goalFormExistingImages = [{ src: goal.coverImage, alt: goal.coverAlt || goal.title }];
  }
  goalFormPendingFiles = [];
  renderGoalImagesPreview();

  if (titleEl) titleEl.textContent = "Редактировать цель";
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  const detailBackdrop = document.querySelector('[data-modal-backdrop="goal-detail"]');
  if (detailBackdrop) detailBackdrop.hidden = true;

  openModalById("goal");
}

async function handleDeleteGoal(goalId) {
  const goal = findGoalById(goalId);
  if (!goal) return;

  const confirmed = await confirmDelete({
    title: "Удалить цель?",
    message: `Цель «${goal.title}» и все её шаги будут удалены без возможности восстановления.`,
  });
  if (!confirmed) return;

  try {
    await deleteGoal(goalId);
    const detailBackdrop = document.querySelector('[data-modal-backdrop="goal-detail"]');
    if (detailBackdrop) detailBackdrop.hidden = true;
    document.body.classList.remove("no-scroll");
    await refreshAppDataIfNeeded();
  } catch (error) {
    console.error("[Delete goal]", error);
    window.alert(error.message || "Не удалось удалить цель");
  }
}

function initGoalForm() {
  // Форма создания/редактирования общей цели:
  // - собирает уже существующие и новые фото в единый gallery
  // - при сохранении сначала загружает файлы, затем отправляет payload цели.
  const root = document.querySelector("[data-goals-page]");
  if (!root) return;

  const form = document.querySelector("[data-goal-form]");
  const fileInput = document.querySelector("[data-goal-images-file]");
  const errorEl = document.querySelector("[data-goal-form-error]");
  if (!form) return;

  document.querySelectorAll('[data-open-modal="goal"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      form.reset();
      form.elements.id.value = "";
      resetGoalFormImages();
      const titleEl = document.querySelector("#goal-modal-title");
      if (titleEl) titleEl.textContent = "Добавить общую цель";
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
    });
  });

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const picked = [...(fileInput.files || [])];
      if (picked.length) {
        goalFormPendingFiles.push(...picked);
        updateFilePickerLabel(fileInput, `Добавлено: ${goalFormPendingFiles.length}`);
      }
      fileInput.value = "";
      renderGoalImagesPreview();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const goalId = form.elements.id.value;
    const title = form.elements.title.value.trim();

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    if (!title) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = "Укажите название цели";
      }
      return;
    }

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Сохранение...";

    try {
      const gallery = goalFormExistingImages.map((image) => ({
        src: image.src,
        alt: image.alt || title,
      }));

      for (const file of goalFormPendingFiles) {
        const uploaded = await uploadGoalImage(file);
        gallery.push({
          src: uploaded.url,
          alt: uploaded.alt || title,
        });
      }

      const payload = {
        title,
        horizon: form.elements.horizon.value.trim() || undefined,
        category: form.elements.category?.value || undefined,
        description: form.elements.description.value.trim() || undefined,
        gallery,
      };

      if (goalId) {
        await updateGoal(goalId, payload);
      } else {
        await createGoal(payload);
      }

      await refreshAppDataIfNeeded();

      form.reset();
      form.elements.id.value = "";
      resetGoalFormImages();

      const backdrop = document.querySelector('[data-modal-backdrop="goal"]');
      if (backdrop) backdrop.hidden = true;
      document.body.classList.remove("no-scroll");
    } catch (error) {
      console.error("[Save goal]", error);
      window.alert(error.message || "Не удалось сохранить цель");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

function renderFamilyList() {
  const grid = document.querySelector("[data-family-grid]");
  if (!grid) return;

  const family = window.APP_DATA?.family ?? [];
  const html = family
    .map((p) => {
      const avatarClass = p.gradient === "alt" ? "avatar-circle avatar-circle--alt" : "avatar-circle";
      const wishlistCount = (window.APP_DATA?.wishlists?.[p.id] ?? []).length;
      return `
        <a href="${routeUrl(APP_ROUTES.wishlist, { id: p.id })}" class="card">
          <div class="card-body">
            <div class="card-title-row">
              <div class="avatar-row">
                <div class="${avatarClass}">${escapeHtml(p.initials)}</div>
                <div>
                  <div class="avatar-text-main">${escapeHtml(p.name)}</div>
                  <div class="avatar-text-sub">${escapeHtml(p.subtitle || "")}</div>
                </div>
              </div>
              <span class="pill-stat">Список хотелок</span>
            </div>
            <div class="divider"></div>
            <p class="card-text">${escapeHtml(p.description || "")}</p>
            <div class="card-footer">
              <span class="card-link">Открыть список →</span>
              <span class="small-muted">хотелок: ${wishlistCount}</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");

  grid.innerHTML = html;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.left = '-9999px';
  document.body.appendChild(helper);
  helper.select();
  document.execCommand('copy');
  document.body.removeChild(helper);
}

function flashCopyButton(button, label = 'Скопировано') {
  if (!button) return;
  const original = button.textContent;
  button.textContent = label;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 1600);
}

function openModalById(id) {
  const backdrop = document.querySelector(`[data-modal-backdrop="${id}"]`);
  if (!backdrop) return;
  backdrop.hidden = false;
  document.body.classList.add('no-scroll');
}

function initFamilyShare() {
  const shareBtn = document.querySelector('[data-family-share-btn]');
  if (!shareBtn) return;

  const backdrop = document.querySelector('[data-modal-backdrop="family-share"]');
  const linkInput = document.querySelector('[data-family-share-link]');
  const codeEl = document.querySelector('[data-family-share-code]');
  const copyCodeBtn = document.querySelector('[data-family-share-copy-code]');
  const expiresEl = document.querySelector('[data-family-share-expires]');
  const errorEl = document.querySelector('[data-family-share-error]');
  const subtitleEl = document.querySelector('[data-family-share-subtitle]');
  let cachedInvite = null;

  function setShareError(message) {
    if (!errorEl) return;
    if (!message) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  }

  function fillShareModal(invite) {
    const inviteUrl = registerWithInviteUrl(invite.code);
    if (linkInput) {
      linkInput.value = inviteUrl;
    }
    if (codeEl) {
      codeEl.textContent = invite.code;
    }
    if (subtitleEl && invite.familyName) {
      subtitleEl.textContent = `Семья «${invite.familyName}». Отправьте ссылку или код — человек сможет зарегистрироваться и сразу попасть в вашу семью.`;
    }
    if (expiresEl && invite.expiresAt) {
      const date = new Date(invite.expiresAt);
      expiresEl.hidden = false;
      expiresEl.textContent = `Код действует до ${date.toLocaleDateString('ru-RU')}`;
    }
    setShareError('');
  }

  shareBtn.addEventListener('click', async () => {
    setShareError('');
    shareBtn.disabled = true;
    const originalLabel = shareBtn.textContent;
    shareBtn.textContent = 'Загрузка...';

    try {
      if (!cachedInvite) {
        cachedInvite = await loadFamilyInvite();
      }
      fillShareModal(cachedInvite);
      openModalById('family-share');
    } catch (error) {
      console.error('[Family share]', error);
      if (backdrop) {
        backdrop.hidden = true;
        document.body.classList.remove('no-scroll');
      }
      window.alert(error.message || 'Не удалось загрузить код приглашения');
    } finally {
      shareBtn.disabled = false;
      shareBtn.textContent = originalLabel;
    }
  });

  document.querySelectorAll('[data-copy-target]').forEach((button) => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-copy-target');
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input?.value) return;

      try {
        await copyTextToClipboard(input.value);
        flashCopyButton(button);
      } catch (error) {
        console.error('[Copy link]', error);
        flashCopyButton(button, 'Ошибка');
      }
    });
  });

  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', async () => {
      const code = codeEl?.textContent?.trim();
      if (!code || code === '------') return;

      try {
        await copyTextToClipboard(code);
        flashCopyButton(copyCodeBtn);
      } catch (error) {
        console.error('[Copy code]', error);
        flashCopyButton(copyCodeBtn, 'Ошибка');
      }
    });
  }
}

function resolveWishlistMemberId() {
  const fromUrl = getQueryParam("id");
  if (fromUrl) {
    return fromUrl;
  }

  const user = typeof getUser === "function" ? getUser() : null;
  if (user?.id) {
    const me = (window.APP_DATA?.family ?? []).find((member) => member.userId === user.id);
    if (me?.id) {
      return me.id;
    }
  }

  const first = (window.APP_DATA?.family ?? [])[0];
  return first?.id || "mom";
}

function renderWishlist() {
  const root = document.querySelector("[data-wishlist]");
  if (!root) return;

  const id = resolveWishlistMemberId();
  const person = (window.APP_DATA?.family ?? []).find((p) => p.id === id);
  const items = window.APP_DATA?.wishlists?.[id] ?? [];

  const title = person ? `Хотелки: ${person.name}` : "Хотелки";
  document.title = `${title} · Личный список`;
  setText("[data-wishlist-title]", title);
  setText(
    "[data-wishlist-subtitle]",
    "Карточки с картинкой, описанием и ссылкой."
  );

  const grid = document.querySelector("[data-wishlist-grid]");
  if (!grid) return;

  familyWishlistItems = items;
  grid.className = "grid grid--wish-tiles";

  if (items.length === 0) {
    grid.innerHTML = `<div class="small-muted">В этом списке пока нет хотелок.</div>`;
    return;
  }

  grid.innerHTML = items.map((w) => buildWishTileHtml(w)).join("");
  bindWishTileInteractions(grid);
}

let myWishlist = [];
let myWishlistLoaded = false;

async function loadMyWishlistFromApi() {
  if (myWishlistLoaded) {
    return myWishlist;
  }

  try {
    myWishlist = await loadMyWishes();
    myWishlistLoaded = true;
    return myWishlist;
  } catch (error) {
    console.error('[My wishes]', error);
    myWishlist = [];
    myWishlistLoaded = true;
    return myWishlist;
  }
}

function invalidateMyWishlistCache() {
  myWishlistLoaded = false;
}

function renderMyWishlist() {
  const grid = document.querySelector("[data-my-wishlist-grid]");
  const emptyEl = document.querySelector("[data-my-wishlist-empty]");
  if (!grid) return;

  if (!myWishlist.length) {
    grid.innerHTML = "";
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent = "Пока нет ни одной хотелки. Добавьте первую, чтобы начать список.";
    }
    return;
  }

  if (emptyEl) {
    emptyEl.textContent = "Отметьте «Видна семье», чтобы хотелка появилась в общем списке.";
  }

  grid.className = "grid grid--wish-tiles";
  grid.innerHTML = myWishlist
    .map((w) => buildWishTileHtml(w, { showActions: true, showVisibility: true }))
    .join("");

  bindWishTileInteractions(grid, { manageActions: true });
}

function resetMyWishImagePreview() {
  const preview = document.querySelector("[data-my-wish-image-preview]");
  const fileInput = document.querySelector("[data-my-wish-image-file]");
  if (fileInput) {
    fileInput.value = "";
  }
  if (preview) {
    preview.hidden = true;
    preview.innerHTML = "";
  }
}

function showMyWishImagePreview(src, label) {
  const preview = document.querySelector("[data-my-wish-image-preview]");
  if (!preview) return;
  preview.hidden = false;
  preview.innerHTML = `
    <img src="${escapeHtml(src)}" alt="${escapeHtml(label || "Превью")}" />
    <span class="image-preview-caption">${escapeHtml(label || "Выбранное изображение")}</span>
  `;
}

function openMyWishForEdit(id) {
  const item = myWishlist.find((w) => w.id === id);
  const form = document.querySelector("[data-my-wish-form]");
  if (!item || !form) return;

  form.elements.id.value = item.id;
  form.elements.title.value = item.title || "";
  form.elements.link.value = item.link || "";
  form.elements.category.value = item.category || "";
  const budgetDigits = parsePriceDigits(item.budget);
  form.elements.budget.value = budgetDigits ? formatPriceInputValue(budgetDigits) : (item.budget || "");
  form.elements.image.value = item.image || "";
  form.elements.description.value = item.description || "";
  if (form.elements.visibility) {
    form.elements.visibility.value = item.visibility || "private";
  }

  resetMyWishImagePreview();
  const fileInput = document.querySelector("[data-my-wish-image-file]");
  if (item.image) {
    showMyWishImagePreview(resolveMediaUrl(item.image), "Текущее изображение");
    updateFilePickerLabel(fileInput, "Текущее изображение");
  } else {
    updateFilePickerLabel(fileInput, null);
  }

  const titleEl = document.querySelector("[data-my-wish-modal-title]");
  if (titleEl) titleEl.textContent = "Редактировать хотелку";

  const backdrop = document.querySelector('[data-modal-backdrop="my-wish"]');
  if (backdrop) {
    backdrop.hidden = false;
    document.body.classList.add("no-scroll");
  }
}

async function handleDeleteMyWish(id) {
  if (!id) return;

  const wish = myWishlist.find((item) => item.id === id);
  const confirmed = await confirmDelete({
    title: "Удалить хотелку?",
    message: wish?.title
      ? `Хотелка «${wish.title}» будет удалена без возможности восстановления.`
      : "Хотелка будет удалена без возможности восстановления.",
  });
  if (!confirmed) return;

  try {
    await deleteWish(id);
    invalidateMyWishlistCache();
    await loadMyWishlistFromApi();
    renderMyWishlist();
    await refreshAppDataIfNeeded();
  } catch (error) {
    console.error('[Delete wish]', error);
    window.alert(error.message || "Не удалось удалить хотелку");
  }
}

function initMyWishlistForm() {
  // Форма личной хотелки работает в двух режимах:
  // создание (POST) и редактирование (PATCH) в зависимости от наличия hidden-поля id.
  const root = document.querySelector("[data-my-wishlist]");
  if (!root) return;

  const form = document.querySelector("[data-my-wish-form]");
  const fileInput = document.querySelector("[data-my-wish-image-file]");
  const budgetInput = document.querySelector("[data-price-input]");
  const errorEl = document.querySelector("[data-my-wish-form-error]");
  if (!form) return;

  if (budgetInput) {
    initPriceInput(budgetInput);
  }

  loadMyWishlistFromApi().then(() => renderMyWishlist());

  document.querySelectorAll('[data-open-modal="my-wish"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      form.reset();
      form.elements.id.value = "";
      form.elements.image.value = "";
      if (form.elements.visibility) {
        form.elements.visibility.value = "family";
      }
      resetMyWishImagePreview();
      updateFilePickerLabel(fileInput, null);
      const titleEl = document.querySelector("[data-my-wish-modal-title]");
      if (titleEl) titleEl.textContent = "Добавить хотелку";
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
    });
  });

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      updateFilePickerLabel(fileInput, file ? file.name : null);
      if (!file) {
        resetMyWishImagePreview();
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      showMyWishImagePreview(objectUrl, file.name);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const title = form.elements.title.value.trim();
    const wishId = form.elements.id.value;
    const file = fileInput?.files?.[0];

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    if (!title) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = "Укажите название хотелки";
      }
      return;
    }

    const payload = {
      title,
      link: form.elements.link.value.trim() || undefined,
      category: form.elements.category.value.trim() || undefined,
      budget: parsePriceDigits(form.elements.budget.value) || undefined,
      description: form.elements.description.value.trim() || undefined,
      visibility: form.elements.visibility?.value === "family" ? "family" : "private",
    };

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Сохранение...';

    try {
      let imageUrl = form.elements.image.value.trim();
      let imageAlt = title;

      if (file) {
        const uploaded = await uploadWishImage(file);
        imageUrl = uploaded.url;
        imageAlt = uploaded.alt || title;
      }

      if (imageUrl) {
        payload.image = imageUrl;
        payload.alt = imageAlt;
      }

      if (wishId) {
        await updateWish(wishId, payload);
      } else {
        await createWish(payload);
      }

      invalidateMyWishlistCache();
      await loadMyWishlistFromApi();
      renderMyWishlist();
      await refreshAppDataIfNeeded();

      form.reset();
      form.elements.id.value = "";
      resetMyWishImagePreview();

      const backdrop = document.querySelector('[data-modal-backdrop="my-wish"]');
      if (backdrop) {
        backdrop.hidden = true;
        document.body.classList.remove("no-scroll");
      }

      const titleEl = document.querySelector("[data-my-wish-modal-title]");
      if (titleEl) titleEl.textContent = "Добавить хотелку";
    } catch (error) {
      console.error('[Save wish]', error);
      window.alert(error.message || "Не удалось сохранить хотелку");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

function initPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((btn) => {
    const input = document.getElementById(btn.getAttribute("data-password-toggle"));
    if (!input) return;
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Скрыть" : "Показать";
      btn.setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
    });
  });
}

async function init() {
  // Точка входа фронтенда:
  // 1) проверка авторизации, 2) инициализация модалок/навигации,
  // 3) загрузка данных, 4) рендер экранов и подключение обработчиков форм.
  initPasswordToggles();

  if (typeof requireAuth === 'function' && !requireAuth()) {
    return;
  }

  ensureWishDetailModal();
  ensureGoalDetailModal();
  ensureConfirmDeleteModal();
  initMobileNav();
  initModals();

  const needsFreshCatalog =
    typeof pageNeedsFreshCatalog === 'function' && pageNeedsFreshCatalog();
  await ensureAppData({ force: needsFreshCatalog });
  initHeaderNav();

  renderGoalsList();
  renderGoalDetail();
  renderFamilyList();
  renderWishlist();
  initFamilyShare();
  initGoalForm();
  initGoalStepForm();
  initMyWishlistForm();

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) {
      return;
    }
    if (typeof pageNeedsFreshCatalog !== 'function' || !pageNeedsFreshCatalog()) {
      return;
    }
    refreshAppDataIfNeeded();
  });
}

document.addEventListener("DOMContentLoaded", init);

