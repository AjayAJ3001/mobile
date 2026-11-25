import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN = 'gs_token';
const USER = 'gs_user';
const WORKING = 'gs_working_rr';

/** Change this when the computer Wi-Fi address changes. */
export const CURRENT_WIFI_IP = '192.168.5.194';
const API_PORT = 4000;

export const COMPUTER_API = `http://${CURRENT_WIFI_IP}:${API_PORT}`;

const CANDIDATES = [
  `http://localhost:${API_PORT}`,
  `http://127.0.0.1:${API_PORT}`,
  COMPUTER_API,
];

export function normalizeBase(value) {
  let url = String(value || '').trim();
  if (!url) return COMPUTER_API;
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  return url.replace(/\/$/, '');
}

let memory = { token: '', baseUrl: COMPUTER_API };
let discovering = null;
let found = false;

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${url}/api/health`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function discoverServer() {
  if (found) return memory.baseUrl;
  if (discovering) return discovering;
  discovering = (async () => {
    for (const url of CANDIDATES) {
      if (await probe(url)) {
        memory.baseUrl = url;
        found = true;
        return url;
      }
    }
    memory.baseUrl = COMPUTER_API;
    return null;
  })();
  try {
    return await discovering;
  } finally {
    discovering = null;
  }
}

export async function loadSession() {
  const [token, user] = await Promise.all([
    AsyncStorage.getItem(TOKEN),
    AsyncStorage.getItem(USER),
  ]);
  memory = {
    token: token || '',
    baseUrl: COMPUTER_API,
  };
  discoverServer();
  return { token: memory.token, user: user ? JSON.parse(user) : null, baseUrl: memory.baseUrl };
}

export function getBaseUrl() {
  return memory.baseUrl;
}

export function authHeaders() {
  const headers = { 'X-Client': 'mobile' };
  if (memory.token) headers.Authorization = `Bearer ${memory.token}`;
  return headers;
}

export async function setBaseUrl(baseUrl) {
  memory.baseUrl = normalizeBase(baseUrl);
}

export async function saveSession(token, user) {
  memory.token = token;
  await AsyncStorage.multiSet([[TOKEN, token], [USER, JSON.stringify(user)]]);
}

export async function clearSession() {
  memory.token = '';
  await AsyncStorage.multiRemove([TOKEN, USER]);
}

export async function api(path, options = {}) {
  if (!options.skipDiscover) await discoverServer();
  const headers = { 'X-Client': 'mobile', ...(options.headers || {}) };
  if (memory.token) headers.Authorization = `Bearer ${memory.token}`;
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(`${memory.baseUrl}${path}`, { ...options, headers, body });
  } catch (err) {
    const message = err?.message || '';
    if (/network request failed|failed to connect|network error|timed out|aborted/i.test(message)) {
      found = false;
      throw new Error(`Cannot reach ${CURRENT_WIFI_IP}. Change CURRENT_WIFI_IP in mobile/src/api.js to this computer's Wi-Fi address.`);
    }
    throw err instanceof Error ? err : new Error(message || 'Request failed.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed.');
    error.payload = data;
    throw error;
  }
  return data;
}

async function workingKey() {
  const raw = await AsyncStorage.getItem(USER);
  const user = raw ? JSON.parse(raw) : null;
  return user?.id ? `${WORKING}:${user.id}` : WORKING;
}

export async function loadWorkingReceipt() {
  const value = await AsyncStorage.getItem(await workingKey());
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function saveWorkingReceipt(id) {
  const key = await workingKey();
  if (!id) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, String(id));
}

export function formatWhen(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
