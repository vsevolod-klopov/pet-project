/**
 * API Configuration
 *
 * baseURL resolution:
 * - Docker (nginx on :8080): same origin — /auth and /api proxied to backend
 * - Live Server / local HTML: direct API on localhost:3000
 * - Override: ?apiBase=http://localhost:3000
 */
function resolveApiBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  const override = params.get('apiBase');
  if (override) {
    return override.replace(/\/$/, '');
  }

  const { origin, port, protocol } = window.location;

  if (protocol === 'file:') {
    return 'http://localhost:3000';
  }

  // nginx in Docker serves frontend and proxies API
  if (port === '8080' || port === '80' || port === '') {
    return origin;
  }

  return 'http://localhost:3000';
}

const GOAL_STEP_STATUSES = [
  { id: 'spark', label: 'Зарождается' },
  { id: 'plan', label: 'Планируем' },
  { id: 'doing', label: 'В процессе' },
  { id: 'done', label: 'Сделано' },
  { id: 'celebrate', label: 'Празднуем' },
];

function getGoalStepStatusLabel(statusId) {
  return GOAL_STEP_STATUSES.find((item) => item.id === statusId)?.label || GOAL_STEP_STATUSES[0].label;
}

const API_CONFIG = {
  baseURL: resolveApiBaseUrl(),
  endpoints: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    inviteCheck: '/auth/invite',
    data: '/api/data',
    familyInvite: '/api/family/invite',
    wishesMine: '/api/wishes/mine',
    wishes: '/api/wishes',
    uploadWishImage: '/api/uploads/wish-image',
    goals: '/api/goals',
    uploadGoalImage: '/api/uploads/goal-image',
    profile: '/api/user/profile',
  },
};

/**
 * Application routes (root-absolute paths)
 */
const APP_ROUTES = {
  home: '/index.html',
  goals: '/pages/goals.html',
  goalDetail: '/pages/goal-detail.html',
  family: '/pages/family.html',
  wishlist: '/pages/wishlist.html',
  myWishlist: '/pages/my-wishlist.html',
  login: '/pages/auth/login.html',
  register: '/pages/auth/register.html',
};

/**
 * Build route URL with optional query params
 * @param {string} path
 * @param {Record<string, string>} [params]
 */
function routeUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return `${url.pathname}${url.search}`;
}

/**
 * Registration link with pre-filled invite code
 * @param {string} code
 */
function registerWithInviteUrl(code) {
  const path = routeUrl(APP_ROUTES.register, { [INVITE_QUERY_KEY]: code });
  if (window.location.protocol === 'file:') {
    return `http://localhost:8080${path}`;
  }
  return `${window.location.origin}${path}`;
}

const WISH_IMAGE_PLACEHOLDER =
  'https://images.pexels.com/photos/949587/pexels-photo-949587.jpeg?auto=compress&cs=tinysrgb&w=800';
const STORAGE_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
  user: 'auth_user',
  family: 'auth_family',
};

/**
 * URL query key for invite code on registration page
 */
const INVITE_QUERY_KEY = 'invite';

/**
 * Paths that do not require authentication
 */
const PUBLIC_ROUTES = new Set([
  '/',
  '/index.html',
  APP_ROUTES.login,
  APP_ROUTES.register,
]);
