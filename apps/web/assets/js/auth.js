/**
 * Authentication module
 * Handles password hashing, API calls, and token management
 */

/**
 * Hash password using SHA-256 and return hex string
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password as hex string
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data
 * @returns {Promise<object>} - Response data
 */
async function apiRequest(endpoint, data) {
  try {
    console.log(`[AUTH] Sending request to: ${API_CONFIG.baseURL}${endpoint}`, data);
    
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      // Важно: CORS режим для кросс-доменных запросов
      mode: 'cors',
      credentials: 'include', // Отправляем cookies если нужны
    });

    console.log(`[AUTH] Response status: ${response.status}`);
    
    let result;
    try {
      result = await response.json();
    } catch (e) {
      console.error('[AUTH] Failed to parse JSON response:', e);
      result = { message: 'Invalid server response' };
    }

    if (!response.ok) {
      console.error(`[AUTH] API Error: ${response.status}`, result);
      throw {
        status: response.status,
        message: result.message || 'API Error',
        data: result,
      };
    }

    console.log('[AUTH] Request successful');
    return result;
  } catch (error) {
    console.error('[AUTH] API Request Error:', error);
    throw error;
  }
}

/**
 * Register new user
 * @param {object} options
 * @param {string} options.email
 * @param {string} options.name
 * @param {string} options.password
 * @param {'create'|'join'} options.familyMode
 * @param {string} [options.familyName]
 * @param {string} [options.inviteCode]
 * @returns {Promise<object>}
 */
async function register({ email, name, password, familyMode, familyName, inviteCode }) {
  const passwordHash = await hashPassword(password);
  
  const result = await apiRequest(API_CONFIG.endpoints.register, {
    email,
    name,
    passwordHash,
    familyMode,
    familyName,
    inviteCode,
  });

  storeAuthSession(result);
  return result;
}

function storeAuthSession(result) {
  if (result.accessToken) {
    localStorage.setItem(STORAGE_KEYS.accessToken, result.accessToken);
  }
  if (result.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, result.refreshToken);
  }
  if (result.user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(result.user));
  }
  if (result.family) {
    localStorage.setItem(STORAGE_KEYS.family, JSON.stringify(result.family));
  }
}

/**
 * Get current family info from registration/login response
 * @returns {object|null}
 */
function getFamily() {
  const raw = localStorage.getItem(STORAGE_KEYS.family);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Check invite code validity (public endpoint)
 * @param {string} code
 * @returns {Promise<{valid: boolean, familyName?: string}>}
 */
async function checkInviteCode(code) {
  const normalized = String(code || '').replace(/\D/g, '');
  if (!normalized) {
    return { valid: false };
  }

  const response = await fetch(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.inviteCheck}/${encodeURIComponent(normalized)}`,
    { method: 'GET', mode: 'cors' },
  );

  if (!response.ok) {
    return { valid: false };
  }

  return response.json();
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<object>} - Login result with tokens
 */
async function login(email, password) {
  const passwordHash = await hashPassword(password);
  
  const result = await apiRequest(API_CONFIG.endpoints.login, {
    email,
    passwordHash,
  });

  storeAuthSession(result);
  return result;
}

/**
 * Refresh access token
 * @returns {Promise<object>} - New tokens
 */
async function refreshToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const result = await apiRequest(API_CONFIG.endpoints.refresh, {
    refreshToken,
  });

  // Store new tokens
  if (result.accessToken) {
    localStorage.setItem(STORAGE_KEYS.accessToken, result.accessToken);
  }
  if (result.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, result.refreshToken);
  }

  return result;
}

/**
 * Get access token
 * @returns {string|null} - Access token or null
 */
function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

/**
 * Get current user data
 * @returns {object|null} - User data or null
 */
function getUser() {
  const userStr = localStorage.getItem(STORAGE_KEYS.user);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user has valid tokens
 */
function isAuthenticated() {
  return !!localStorage.getItem(STORAGE_KEYS.accessToken);
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.family);
  window.location.href = APP_ROUTES.login;
}

/**
 * Whether current path requires authentication
 * @param {string} [pathname]
 * @returns {boolean}
 */
function isProtectedRoute(pathname = window.location.pathname) {
  if (PUBLIC_ROUTES.has(pathname)) {
    return false;
  }
  if (pathname.startsWith('/pages/auth/')) {
    return false;
  }
  if (pathname.startsWith('/pages/')) {
    return true;
  }
  return false;
}

/**
 * Redirect guests away from protected pages
 * @returns {boolean} false if redirecting
 */
function requireAuth() {
  if (!isProtectedRoute()) {
    return true;
  }
  if (isAuthenticated()) {
    return true;
  }

  const returnUrl = encodeURIComponent(
    `${window.location.pathname}${window.location.search}`,
  );
  window.location.href = `${APP_ROUTES.login}?return=${returnUrl}`;
  return false;
}

/**
 * Redirect authenticated users away from login/register
 * @param {string} [fallback]
 */
function redirectIfAuthenticated(fallback = APP_ROUTES.home) {
  if (isAuthenticated()) {
    window.location.href = fallback;
  }
}

/**
 * Make authenticated API request with automatic token refresh
 * @param {string} url - API URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Response object
 */
async function authenticatedFetch(url, options = {}) {
  let token = getAccessToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    try {
      await refreshToken();
      token = getAccessToken();
      
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      logout();
      throw new Error('Session expired');
    }
  }

  return response;
}

/**
 * Authenticated multipart upload (do not set Content-Type manually).
 * @param {string} url
 * @param {FormData} formData
 * @returns {Promise<Response>}
 */
async function authenticatedUpload(url, formData) {
  let token = getAccessToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  let response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    try {
      await refreshToken();
      token = getAccessToken();
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } catch (error) {
      logout();
      throw new Error('Session expired');
    }
  }

  return response;
}
