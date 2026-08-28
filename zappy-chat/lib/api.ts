const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export type ConversationOrderItem = {
  lineTotalCents: number;
  productId: string;
  productName: string;
  quantity: number;
  unitAmountCents: number;
};

export type ConversationOrder = {
  canceled: boolean;
  createdAt: string;
  customer: { name: string | null; phone: string | null };
  deliveryFeeCents: number;
  discountedSubtotalCents: number;
  id: string;
  items: ConversationOrderItem[];
  number: string | null;
  orderType: string;
  paymentMethod: string;
  status: string;
  subtotalCents: number;
  tipAmountCents: number;
  tipPercent: number;
  totalCents: number;
};

export type CatalogModifierGroupItem = {
  id: string;
  name: string;
  price: number | null;
  description: string | null;
};

export type CatalogModifierGroup = {
  id: string;
  title: string;
  description: string | null;
  required: boolean;
  type: 'MULTI' | 'SINGLE' | null;
  minSelection: number | null;
  maxSelection: number | null;
  items: CatalogModifierGroupItem[];
};

export type CatalogProduct = {
  id: string;
  name: string;
  price: number | null;
  description: string | null;
  categoryId: string | null;
  categoryIds: string[];
  photos: Array<{ url: string }>;
  modifierGroups: CatalogModifierGroup[];
  visible: boolean;
};

export type CatalogCategory = {
  id: string;
  name: string;
};

export type CatalogResponse = {
  products: CatalogProduct[];
  lookup: { categories: CatalogCategory[] };
};

export async function fetchProducts(
  token: string,
  businessId: string | null,
): Promise<CatalogResponse> {
  return apiFetch('/products', token, businessId);
}

/* ── CATEGORIES ────────────────────────────────────────────── */

export type CategoryModifierGroupItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  photo?: { id: string; url: string };
};

export type CategoryModifierGroup = {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  type: 'MULTI' | 'SINGLE' | null;
  minSelection: number | null;
  maxSelection: number | null;
  items: CategoryModifierGroupItem[];
};

export type CategoryProduct = {
  visible: boolean;
  id: string;
  itemType: 'PRODUCT' | 'COMBO';
  name: string;
  description?: string;
  price?: number;
  categoryIndex?: number;
  modifierGroups: CategoryModifierGroup[];
  photos?: Array<{ id: string; url: string }>;
  comboSlots: unknown[];
  products: unknown[];
};

export type CategoryItem = {
  id: string;
  title: string;
  menuIndex: number | null;
  products: CategoryProduct[];
};

export type CategoriesResponse = CategoryItem[];

export async function fetchCategories(
  token: string,
  businessId: string | null,
): Promise<CategoriesResponse> {
  return apiFetch('/categories', token, businessId);
}

export type ConversationOrderIntentProduct = {
  id: string;
  amount: number | null;
  comments: string | null;
  fullAmount: number | null;
  modifierGroupItemIds: string[];
  productId: string;
  quantity: number;
};

export type ConversationOrderIntent = {
  id: string;
  customerId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  language: string | null;
  status: 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  type: 'DELIVERY' | 'TAKEAWAY';
  paymentMethod: 'CARD' | 'CASH' | 'ZELLE';
  paymentProvider: 'STRIPE' | null;
  tipAmount: number | null;
  tags: string[];
  progressiveDiscountSnapshot: unknown;
  amount: number | null;
  deliveryAddress: DeliveryAddress | null;
  deliveryAddressId: string | null;
  orderProducts: ConversationOrderIntentProduct[];
};

async function apiFetch(path: string, token: string, businessId?: string | null, method = 'GET'): Promise<any> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (businessId) headers['x-business-id'] = businessId;
  const r = await fetch(`${BASE}${path}`, { method, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('api_error'), { status: r.status, data });
  return data;
}

/* ── AUTH ──────────────────────────────────────────────────── */

export async function sendOtp(phone: string): Promise<void> {
  const r = await fetch(`${BASE}/owners/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('send_failed'), { status: r.status, data });
}

export type VerifyOtpResult = {
  ok: boolean;
  accessToken: string;
  expiresAt: string;
  owner: { id: string; email: string; name: string; phone: string | null };
  businesses: Array<{ id: string; name: string }>;
  selectedBusinessId: string | null;
};

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const r = await fetch(`${BASE}/owners/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('verify_failed'), { status: r.status, data });
  return data as VerifyOtpResult;
}

/* ── BRANCHES ──────────────────────────────────────────────── */

export type Branch = { id: string; name: string; chatwootAccountId: string | null; chatwootSourceId: string | null };

export async function fetchBranches(token: string, businessId: string): Promise<{ branches: Branch[] }> {
  return apiFetch('/businesses/current/onboarding', token, businessId);
}

/* ── CONVERSATIONS ─────────────────────────────────────────── */

export type ConversationSummary = {
  id: number;
  account_id?: number;
  inbox_id?: number;
  status?: 'ai_handling' | 'take_care';
  chatwootStatus?: string;
  assignee_id?: number | null;
  contact_inbox?: unknown;
  last_activity_at?: number | string | null;
  timestamp?: number | string | null;
  unread_count?: number;
  messages?: unknown[];
  meta?: {
    sender?: unknown;
    assignee?: unknown;
    hmac_verified?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type ConversationListResponse = {
  data: {
    meta?: {
      all_count?: number;
      mine_count?: number;
      assigned_count?: number;
      unassigned_count?: number;
      [key: string]: unknown;
    };
    payload?: ConversationSummary[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/* ── MESSAGES ──────────────────────────────────────────────── */

export type ConversationMessage = {
  id: number;
  content?: string | null;
  message_type?: number; // 0=incoming 1=outgoing 2=activity 3=template
  private?: boolean;
  created_at?: number | string;
  content_attributes?: {
    sent_by?: string;
    [key: string]: unknown;
  };
  sender?: { id?: number; name?: string; type?: string; [key: string]: unknown };
  attachments?: unknown[];
  [key: string]: unknown;
};

export type ConversationMessagesResponse = {
  meta?: { count?: number; [key: string]: unknown };
  payload?: ConversationMessage[];
  [key: string]: unknown;
};

export async function fetchMessages(
  token: string,
  businessId: string | null,
  branchId: string,
  conversationId: string,
): Promise<ConversationMessagesResponse> {
  const qs = new URLSearchParams({ branchId });
  return apiFetch(`/conversation/${conversationId}/messages?${qs}`, token, businessId);
}

export async function takeOverConversation(
  token: string,
  businessId: string | null,
  branchId: string,
  conversationId: string,
): Promise<void> {
  const qs = new URLSearchParams({ branchId });
  return apiFetch(`/conversation/${conversationId}/take-care?${qs}`, token, businessId, 'POST');
}

export async function sendConversationMessage(
  token: string,
  businessId: string | null,
  branchId: string,
  conversationId: string,
  input: {
    content: string;
    private?: boolean;
    content_attributes?: Record<string, unknown>;
  },
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (businessId) headers['x-business-id'] = businessId;
  const qs = new URLSearchParams({ branchId });
  const r = await fetch(`${BASE}/conversation/${conversationId}/messages?${qs}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('api_error'), { status: r.status, data });
  return data;
}

export async function markConversationRead(
  token: string,
  businessId: string | null,
  branchId: string,
  conversationId: string,
): Promise<void> {
  const qs = new URLSearchParams({ branchId });
  return apiFetch(`/conversation/${conversationId}/read?${qs}`, token, businessId, 'POST');
}

export async function resolveConversation(
  token: string,
  businessId: string | null,
  branchId: string,
  conversationId: string,
): Promise<void> {
  const qs = new URLSearchParams({ branchId });
  return apiFetch(`/conversation/${conversationId}/resolve?${qs}`, token, businessId, 'POST');
}

export async function registerPushDevice(
  token: string,
  businessId: string | null,
  pushToken: string,
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (businessId) headers['x-business-id'] = businessId;
  const r = await fetch(`${BASE}/owners/me/push-devices/ios`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pushToken }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('api_error'), { status: r.status, data });
}

export async function fetchConversation(
  token: string,
  businessId: string | null,
  branchId: string,
  conversationId: string,
): Promise<{ data: { payload?: ConversationSummary } }> {
  const qs = new URLSearchParams({ branchId });
  return apiFetch(`/conversation/${conversationId}?${qs}`, token, businessId);
}

/* ── PROGRESSIVE DISCOUNT ──────────────────────────────────── */

export type ProgressiveDiscountStep = {
  id: string;
  type: string;
  amount?: number;
  discount?: number;
  prizes: Array<{
    id: string;
    name: string;
    quantity: number;
    imageUrl: string | null;
    progressiveDiscountStepId: string;
    products: Array<{ id: string; name: string; price: number | null }>;
  }>;
};

export type ProgressiveDiscount = {
  id: string;
  steps: ProgressiveDiscountStep[];
} | null;

export async function fetchProgressiveDiscount(
  token: string,
  businessId: string | null,
): Promise<ProgressiveDiscount> {
  return apiFetch('/progressive-discount', token, businessId);
}

/* ── ORDER INTENT ──────────────────────────────────────────── */

export async function upsertOrderIntent(
  token: string,
  businessId: string | null,
  payload: { id: string; active: boolean },
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (businessId) headers['x-business-id'] = businessId;
  const r = await fetch(`${BASE}/order-intents/upsert`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw Object.assign(new Error('api_error'), { status: r.status, data });
  }
}

/* ── ORDERS ────────────────────────────────────────────────── */

export type CreateOrderBody = {
  cart: {
    items: Array<{
      cartId: string;
      productId: string;
      quantity: number;
      description?: string;
      modifiers: Array<{ modifierId: string; modifierItemId: string }>;
    }>;
  };
  customerId?: string | null;
  orderType: 'DELIVERY' | 'TAKEAWAY';
  paymentMethod: 'CARD' | 'CASH' | 'ZELLE';
  paymentProvider?: 'STRIPE' | null;
  language?: string;
  scheduleFor?: string | null;
  addressId?: string | null;
  tipAmount?: number;
  branchId?: string | null;
  orderIntentId?: string | null;
};

export async function createOrder(
  token: string,
  businessId: string | null,
  body: CreateOrderBody,
): Promise<{ id: string; number: string | null }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (businessId) headers['x-business-id'] = businessId;
  const r = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('api_error'), { status: r.status, data });
  return data;
}

/* ── CUSTOMER ADDRESSES ────────────────────────────────────── */

export type DeliveryAddress = {
  id: string;
  description: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  lat: string;
  lng: string;
  complement: string | null;
  numberComplement: string | null;
  customerId: string | null;
  deliveryFee: number;
};

/* ── ADDRESS SEARCH ────────────────────────────────────────── */

export type AddressSuggestion = {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  address: {
    house_number: string | null;
    road: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
    country_code: string;
  };
};

export async function searchAddresses(
  token: string,
  businessId: string | null,
  q: string,
): Promise<AddressSuggestion[]> {
  const qs = new URLSearchParams({ q });
  return apiFetch(`/address-search?${qs}`, token, businessId);
}

export async function createCustomerAddress(
  token: string,
  businessId: string | null,
  customerId: string,
  body: {
    description: string;
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
    lat: string;
    lng: string;
    complement?: string | null;
    numberComplement?: string | null;
  },
): Promise<DeliveryAddress> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (businessId) headers['x-business-id'] = businessId;
  const r = await fetch(`${BASE}/customers/${customerId}/addresses`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('api_error'), { status: r.status, data });
  return data as DeliveryAddress;
}

export async function fetchCustomerAddresses(
  token: string,
  businessId: string | null,
  phone: string,
): Promise<DeliveryAddress[]> {
  const qs = new URLSearchParams({ phone });
  const results: Array<{ addresses: DeliveryAddress[] }> = await apiFetch(
    `/customers/search?${qs}`,
    token,
    businessId,
  );
  return results[0]?.addresses ?? [];
}

export async function fetchConversations(
  token: string,
  businessId: string | null,
  branchId: string,
  params?: { page?: number; status?: string; per_page?: number },
): Promise<ConversationListResponse> {
  const qs = new URLSearchParams({ branchId });
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.per_page != null) qs.set('per_page', String(params.per_page));
  if (params?.status) qs.set('status', params.status);
  return apiFetch(`/conversation?${qs}`, token, businessId);
}
