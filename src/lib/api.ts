/**
 * Client de l'API FastAPI (inscriptions -> Google Drive + Sheets + notification admin).
 *
 * L'URL est configurable par environnement via VITE_API_URL :
 *  - en local  : http://localhost:8000 (valeur par défaut ci-dessous)
 *  - en prod   : l'URL publique de l'API déployée (Railway), à définir dans Vercel.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface RegistrationResult {
  registration_id: string;
  drive_folder_id: string;
  drive_folder_link: string;
}

/** Inscription telle que lue depuis la Google Sheet (source affichée dans l'admin). */
export interface RegistrationIndexRow {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  service_type: string;
  departure_date: string | null;
  drive_folder_link: string | null;
}

/**
 * fetch + message clair quand l'API est injoignable.
 * Sans ça, le navigateur renvoie juste "Failed to fetch" / "Load failed",
 * qui ne dit ni l'URL appelée ni la cause probable.
 */
async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error(
      `Impossible de joindre l'API sur ${API_URL}. ` +
        `Vérifiez qu'elle est démarrée (uvicorn main:app --port 8000) et que l'URL est correcte.`,
    );
  }
}

/** Extrait un message d'erreur lisible d'une réponse d'erreur FastAPI. */
async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  } catch {
    /* réponse non-JSON : on retombe sur le message générique ci-dessous */
  }
  return `Erreur ${res.status}`;
}

/**
 * Soumet une inscription. Le passeport est envoyé en multipart dans la même requête,
 * l'API se charge de créer le dossier Drive du pèlerin et de notifier l'agence.
 */
export async function submitRegistration(
  fields: Record<string, string | boolean | null | undefined>,
  passportFile: File | null,
): Promise<RegistrationResult> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === "") continue;
    form.append(key, typeof value === "boolean" ? String(value) : value);
  }
  if (passportFile) form.append("passport", passportFile);

  const res = await request("/registrations", { method: "POST", body: form });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

/** Liste des inscriptions (réservé à l'admin — nécessite le token de session Supabase). */
export async function fetchRegistrations(accessToken: string): Promise<RegistrationIndexRow[]> {
  const res = await request("/registrations", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

// --- Contenu editable depuis l'admin ---------------------------------------

export interface Departure {
  id: string;
  created_at: string;
  date: string;
  package_label: string;
  seats: number;
  description: string | null;
  image_url: string | null;
  image_file_id: string | null;
  active: boolean;
}

/** Champs d'une date de départ tels que saisis dans l'admin. */
export interface DepartureForm {
  date: string;
  package_label: string;
  seats: number;
  description: string;
  active: boolean;
}

export interface Video {
  id: string;
  created_at: string;
  sort_order: number;
  title: string;
  youtube_id: string;
  youtube_url: string;
  embed_url: string;
}

export interface Package {
  id: string;
  created_at: string;
  sort_order: number;
  name: string;
  duration: string | null;
  price: string | null;
  description: string | null;
  features: string[];
  image_url: string | null;
  image_file_id: string | null;
  active: boolean;
}

/** Champs d'un forfait tels que saisis dans l'admin. */
export interface PackageForm {
  name: string;
  duration: string;
  price: string;
  description: string;
  /** Une inclusion par ligne. */
  features: string;
  sort_order: number;
  active: boolean;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

async function getJson<T>(path: string, token?: string): Promise<T> {
  const res = await request(path, token ? { headers: authHeaders(token) } : undefined);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

/** Dates de depart affichees dans la section Planning (lecture publique). */
export const fetchDepartures = () => getJson<Departure[]>("/departures");

export const fetchAllDepartures = (token: string) => getJson<Departure[]>("/departures/all", token);

function departureFormData(form: DepartureForm, image: File | null): FormData {
  const fd = new FormData();
  fd.append("date", form.date);
  fd.append("package_label", form.package_label);
  fd.append("seats", String(form.seats));
  fd.append("description", form.description);
  fd.append("active", String(form.active));
  if (image) fd.append("image", image);
  return fd;
}

export async function createDeparture(
  token: string,
  form: DepartureForm,
  image: File | null,
): Promise<Departure> {
  const res = await request("/departures", {
    method: "POST",
    headers: authHeaders(token),
    body: departureFormData(form, image),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

/** L'image n'est remplacée que si un nouveau fichier est fourni. */
export async function updateDeparture(
  token: string,
  id: string,
  form: DepartureForm,
  image: File | null,
): Promise<Departure> {
  const res = await request(`/departures/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: departureFormData(form, image),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function deleteDeparture(token: string, id: string): Promise<void> {
  const res = await request(`/departures/${id}`, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
}

/** Videos affichees dans la section Videos (lecture publique). */
export const fetchVideos = () => getJson<Video[]>("/videos");

export async function addVideo(
  token: string,
  payload: { title: string; youtube_url: string; sort_order?: number },
): Promise<Video> {
  return postJson<Video>("/videos", { sort_order: 0, ...payload }, token);
}

export async function deleteVideo(token: string, id: string): Promise<void> {
  const res = await request(`/videos/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await readError(res));
}

// --- Session admin ---------------------------------------------------------

const TOKEN_KEY = "saalim_admin_token";

/** Jeton de session admin, conservé entre les rechargements de page. */
export const getToken = (): string | null =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => window.localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

export interface LoginResult {
  access_token: string;
  expires_in_minutes: number;
  email: string;
}

/** Connexion de l'admin : l'API valide les identifiants et renvoie un jeton signé. */
export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const result: LoginResult = await res.json();
  setToken(result.access_token);
  return result;
}

/** Jeton courant, ou erreur explicite si la session a disparu. */
export function requireToken(): string {
  const token = getToken();
  if (!token) throw new Error("Session expirée, reconnectez-vous.");
  return token;
}

// --- Paiements, avis, messages de contact (SQLite via l'API) ---------------

export interface Payment {
  id: string;
  created_at: string;
  payer_name: string;
  payer_phone: string;
  amount: number | null;
  currency: string;
  method: string;
  installment_type: string;
  reference: string | null;
  notes: string | null;
  status: string;
}

export interface Review {
  id: string;
  created_at: string;
  author_name: string;
  email: string | null;
  rating: number;
  comment: string;
  service_type: string | null;
  travel_period: string | null;
  approved: boolean;
}

export interface ContactMessage {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  language: string;
}

export interface AdminStats {
  payments_total: number;
  payments_confirmed: number;
  reviews_pending: number;
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? authHeaders(token) : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

// Paiements
export const declarePayment = (payload: {
  payer_name: string;
  payer_phone: string;
  amount?: number | null;
  method: string;
  installment_type: string;
  reference?: string | null;
  notes?: string | null;
}) => postJson<Payment>("/payments", payload);

export const fetchPayments = (token: string) => getJson<Payment[]>("/payments", token);

export const confirmPayment = (token: string, id: string) =>
  postJson<{ confirmed: string }>(`/payments/${id}/confirm`, {}, token);

// Avis
export const submitReview = (payload: {
  author_name: string;
  email?: string | null;
  rating: number;
  comment: string;
  service_type?: string | null;
  travel_period?: string | null;
}) => postJson<Review>("/reviews", payload);

/** Avis approuves, affiches publiquement sur le site. */
export const fetchPublicReviews = (limit = 3) => getJson<Review[]>(`/reviews?limit=${limit}`);

export const fetchAllReviews = (token: string) => getJson<Review[]>("/reviews/all", token);

export const approveReview = (token: string, id: string) =>
  postJson<{ approved: string }>(`/reviews/${id}/approve`, {}, token);

export async function removeReview(token: string, id: string): Promise<void> {
  const res = await request(`/reviews/${id}`, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
}

// Contact
export const sendContactMessage = (payload: {
  full_name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  language: string;
}) => postJson<ContactMessage>("/contact", payload);

export const fetchContactMessages = (token: string) => getJson<ContactMessage[]>("/contact", token);

export const fetchStats = (token: string) => getJson<AdminStats>("/stats", token);

// --- Forfaits (section Packages, editable depuis l'admin) ------------------

/** Forfaits actifs, affiches sur le site. */
export const fetchPackages = () => getJson<Package[]>("/packages");

/** Tous les forfaits, y compris ceux masques (admin). */
export const fetchAllPackages = (token: string) => getJson<Package[]>("/packages/all", token);

function packageFormData(form: PackageForm, image: File | null): FormData {
  const fd = new FormData();
  fd.append("name", form.name);
  fd.append("duration", form.duration);
  fd.append("price", form.price);
  fd.append("description", form.description);
  fd.append("features", form.features);
  fd.append("sort_order", String(form.sort_order));
  fd.append("active", String(form.active));
  if (image) fd.append("image", image);
  return fd;
}

export async function createPackage(token: string, form: PackageForm, image: File | null): Promise<Package> {
  const res = await request("/packages", {
    method: "POST",
    headers: authHeaders(token),
    body: packageFormData(form, image),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

/** L'image n'est remplacee que si un nouveau fichier est fourni. */
export async function updatePackage(
  token: string,
  id: string,
  form: PackageForm,
  image: File | null,
): Promise<Package> {
  const res = await request(`/packages/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: packageFormData(form, image),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function deletePackage(token: string, id: string): Promise<void> {
  const res = await request(`/packages/${id}`, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) throw new Error(await readError(res));
}
