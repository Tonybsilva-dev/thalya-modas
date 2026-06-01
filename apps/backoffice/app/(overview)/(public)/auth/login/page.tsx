import { LoginRoute } from "@/src/features/auth/login/presentation/login-route";
import { getLastStoreServer } from "@/src/shared/store/get-last-store-server";

export default async function LoginPage() {
  const lastStore = await getLastStoreServer();

  return <LoginRoute brandName={lastStore?.name} />;
}
