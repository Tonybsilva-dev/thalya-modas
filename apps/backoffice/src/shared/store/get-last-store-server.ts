import { cookies } from "next/headers";

import { getLastStoreFromCookie, lastStoreCookieName } from "./last-store-cookie";

export async function getLastStoreServer() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(lastStoreCookieName)?.value;

  return getLastStoreFromCookie(`${lastStoreCookieName}=${cookieValue ?? ""}`);
}
