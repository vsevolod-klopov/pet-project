/**
 * Load application catalog from API (requires auth).
 */
async function loadAppDataFromApi() {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.data}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to load data (${response.status})`);
  }
  return response.json();
}

/**
 * Load family invite code and metadata (requires auth).
 */
async function loadFamilyInvite() {
  const response = await authenticatedFetch(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.familyInvite}`,
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to load invite (${response.status})`);
  }
  return response.json();
}

async function loadMyWishes() {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.wishesMine}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to load wishes (${response.status})`);
  }
  return response.json();
}

async function createWish(data) {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.wishes}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to create wish', data: error };
  }
  return response.json();
}

async function updateWish(id, data) {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.wishes}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to update wish', data: error };
  }
  return response.json();
}

async function deleteWish(id) {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.wishes}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to delete wish', data: error };
  }
  return response.json();
}

async function uploadWishImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await authenticatedUpload(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.uploadWishImage}`,
    formData,
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to upload image', data: error };
  }

  return response.json();
}

async function createGoal(data) {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.goals}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to create goal', data: error };
  }
  return response.json();
}

async function updateGoal(id, data) {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.goals}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to update goal', data: error };
  }
  return response.json();
}

async function deleteGoal(id) {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.goals}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to delete goal', data: error };
  }
  return response.json();
}

async function uploadGoalImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await authenticatedUpload(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.uploadGoalImage}`,
    formData,
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to upload image', data: error };
  }

  return response.json();
}

async function createGoalStep(goalId, data) {
  const response = await authenticatedFetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.goals}/${goalId}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to create goal step', data: error };
  }
  return response.json();
}

async function deleteGoalStep(goalId, stepId) {
  const response = await authenticatedFetch(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.goals}/${goalId}/steps/${stepId}`,
    { method: 'DELETE' },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.message || 'Failed to delete goal step', data: error };
  }
  return response.json();
}

/**
 * Reload family catalog from API (goals, family, wishlists).
 */
async function refreshAppData() {
  // Централизованная синхронизация каталога: подтягивает актуальные семейные данные с API.
  if (typeof isAuthenticated !== 'function' || !isAuthenticated()) {
    return { ok: false };
  }

  try {
    const data = await loadAppDataFromApi();
    window.APP_DATA = data;
    return { ok: true, source: 'api' };
  } catch (error) {
    console.warn('[API] Could not refresh catalog', error);
    return { ok: false, error };
  }
}

/**
 * Reload catalog and re-render lists that depend on it.
 */
async function refreshAppDataIfNeeded() {
  // После успешного обновления данных перерисовываем все экраны,
  // которые зависят от общего каталога window.APP_DATA.
  const result = await refreshAppData();
  if (!result.ok) {
    return result;
  }

  if (typeof renderWishlist === 'function') {
    renderWishlist();
  }
  if (typeof renderFamilyList === 'function') {
    renderFamilyList();
  }
  if (typeof renderGoalsList === 'function') {
    renderGoalsList();
  }
  if (typeof renderGoalDetail === 'function') {
    renderGoalDetail();
  }

  return result;
}

/**
 * Pages that must always load a fresh catalog (wishlists change often).
 */
function pageNeedsFreshCatalog() {
  return Boolean(
    document.querySelector('[data-wishlist], [data-family-grid], [data-my-wishlist], [data-goals-page]'),
  );
}

/**
 * Ensure window.APP_DATA is populated.
 * Authenticated users get data from API; guests keep static fallback from data.js.
 */
async function ensureAppData(options = {}) {
  // Приоритет источника данных:
  // 1) авторизованный пользователь -> API,
  // 2) если API недоступен -> fallback на статический data.js.
  const force = options.force === true;

  if (typeof isAuthenticated !== 'function' || !isAuthenticated()) {
    return { source: 'static' };
  }

  if (force) {
    const refreshed = await refreshAppData();
    if (refreshed.ok) {
      return { source: 'api' };
    }
    console.warn('[API] Forced refresh failed, using static data.js', refreshed.error);
    return { source: 'static', error: refreshed.error };
  }

  try {
    const data = await loadAppDataFromApi();
    window.APP_DATA = data;
    return { source: 'api' };
  } catch (error) {
    console.warn('[API] Could not load catalog, using static data.js', error);
    return { source: 'static', error };
  }
}

/**
 * Header and mobile sidebar are rendered in app.js (`initHeaderNav`).
 */
