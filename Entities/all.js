import Party from './Party.js';
import PartyMember from './PartyMember.js';
import Friend from './Friend.js';
import Notification from './Notification.js';
import Photo from './Photo.js';
import Poll from './Poll.js';
import Vote from './Vote.js';

const TOKEN_KEY = 'letslink_auth_token';
const USER_CACHE_KEY = 'letslink_user_cache';

const importMetaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const processEnv = typeof process !== 'undefined' ? process.env : undefined;

const resolveApiBase = () => {
  if (typeof window !== 'undefined') {
    return (
      window.__LETS_LINK_API__ ||
      window.localStorage?.getItem('letslink_api_base') ||
      importMetaEnv?.VITE_API_URL ||
      processEnv?.REACT_APP_API_URL ||
      'http://localhost:4000'
    );
  }
  return (
    processEnv?.REACT_APP_API_URL ||
    processEnv?.API_BASE_URL ||
    importMetaEnv?.VITE_API_URL ||
    'http://localhost:4000'
  );
};

const authStorage = {
  getToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (typeof window === 'undefined') return;
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  },
  cacheUser(user) {
    if (typeof window === 'undefined') return;
    if (user) {
      window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_CACHE_KEY);
    }
  },
  getCachedUser() {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  },
  clear() {
    this.setToken(null);
    this.cacheUser(null);
  },
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
      return;
    }
    searchParams.append(key, value);
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const request = async (path, { method = 'GET', body, query, headers } = {}) => {
  const baseUrl = resolveApiBase().replace(/\/$/, '');
  const queryString = buildQueryString(query);
  const url = `${baseUrl}${path}${queryString}`;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const token = authStorage.getToken();
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error('Unable to reach the Lets Link API');
  }

  if (response.status === 204) {
    return null;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      authStorage.clear();
    }
    const message = payload?.message || payload || 'Request failed';
    throw new Error(message);
  }

  return payload;
};

const normalizeSort = (sort) => {
  if (!sort) return undefined;
  if (Array.isArray(sort)) return sort;
  return [sort].filter(Boolean);
};

const createEntityClient = (name, basePath) => {
  const buildSortQuery = (sort) => {
    const normalized = normalizeSort(sort);
    if (!normalized || normalized.length === 0) return {};
    if (normalized.length === 1) {
      return { sort: normalized[0] };
    }
    return { sort: normalized };
  };

  return {
    list(sort) {
      return request(basePath, { query: buildSortQuery(sort) });
    },
    filter(filters = {}, sort) {
      return request(basePath, { query: { ...filters, ...buildSortQuery(sort) } });
    },
    get(id) {
      if (!id) throw new Error(`${name}.get requires an id`);
      return request(`${basePath}/${id}`);
    },
    create(payload) {
      return request(basePath, { method: 'POST', body: payload });
    },
    update(id, payload) {
      if (!id) throw new Error(`${name}.update requires an id`);
      return request(`${basePath}/${id}`, { method: 'PATCH', body: payload });
    },
    delete(id) {
      if (!id) throw new Error(`${name}.delete requires an id`);
      return request(`${basePath}/${id}`, { method: 'DELETE' });
    },
  };
};

const PartyClient = createEntityClient('Party', '/parties');
const PartyMemberClient = createEntityClient('PartyMember', '/party-members');
const FriendClient = createEntityClient('Friend', '/friends');
const NotificationClient = createEntityClient('Notification', '/notifications');
const PhotoClient = createEntityClient('Photo', '/photos');
const PollClient = createEntityClient('Poll', '/polls');
const VoteClient = createEntityClient('Vote', '/votes');

const UserClient = {
  ...createEntityClient('User', '/users'),
  async me() {
    try {
      const user = await request('/users/me');
      authStorage.cacheUser(user);
      return user;
    } catch (error) {
      if (error.message?.toLowerCase().includes('authentication')) {
        authStorage.clear();
      }
      throw error;
    }
  },
  async updateMyUserData(payload) {
    const updated = await request('/users/me', { method: 'PATCH', body: payload });
    authStorage.cacheUser(updated);
    return updated;
  },
  getCachedUser() {
    return authStorage.getCachedUser();
  },
  async login(credentials) {
    const response = await request('/auth/login', { method: 'POST', body: credentials });
    if (response?.token) {
      authStorage.setToken(response.token);
    }
    if (response?.user) {
      authStorage.cacheUser(response.user);
    }
    return response?.user;
  },
  async register(payload) {
    const response = await request('/auth/register', { method: 'POST', body: payload });
    if (response?.token) {
      authStorage.setToken(response.token);
    }
    if (response?.user) {
      authStorage.cacheUser(response.user);
    }
    return response?.user;
  },
  logout() {
    authStorage.clear();
  },
};

export const EntityDefinitions = {
  Party,
  PartyMember,
  Friend,
  Notification,
  Photo,
  Poll,
  Vote,
};

export const apiClient = {
  request,
  resolveApiBase,
};

export { UserClient as User, PartyClient as Party, PartyMemberClient as PartyMember, FriendClient as Friend, NotificationClient as Notification, PhotoClient as Photo, PollClient as Poll, VoteClient as Vote };
