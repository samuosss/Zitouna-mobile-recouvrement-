import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://gigantic-borax-handyman.ngrok-free.dev/api/v1"; // ← mets ton IP PC ici


async function getToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem("auth");
    if (raw) return JSON.parse(raw).accessToken ?? null;
  } catch {}
  return null;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getToken();
  console.log("🔑 Token utilisé:", token ? token.slice(0, 20) + "..." : "AUCUN TOKEN");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
   if (!res.ok) {
    console.log("❌ Erreur", res.status, "sur", path);
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail ?? `Erreur ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get:    <T>(path: string)               => request<T>("GET",    path),
  post:   <T>(path: string, body?: unknown) => request<T>("POST",   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>("PUT",    path, body),
  delete: <T>(path: string)               => request<T>("DELETE", path),
};
