import { QueryClient, QueryFunction } from "@tanstack/react-query";

function getTelegramHeaders(): Record<string, string> {
  const webApp = (window as any).Telegram?.WebApp;
  const user = webApp?.initDataUnsafe?.user;
  
  if (user) {
    return {
      "x-telegram-user-id": String(user.id),
      "x-telegram-username": user.username || "",
      "x-telegram-first-name": user.first_name || "",
      "x-telegram-last-name": user.last_name || "",
    };
  }
  
  // Development fallback
  if (import.meta.env.DEV) {
    return {
      "x-telegram-user-id": "123456789",
      "x-telegram-username": "testuser",
      "x-telegram-first-name": "Test",
      "x-telegram-last-name": "User",
    };
  }
  
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const telegramHeaders = getTelegramHeaders();
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...telegramHeaders,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const telegramHeaders = getTelegramHeaders();
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: telegramHeaders,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
