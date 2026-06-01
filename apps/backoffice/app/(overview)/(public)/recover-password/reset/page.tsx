import { RecoverPasswordRoute } from "@/src/features/auth/recover-password/presentation/recover-password-route";
import { getLastStoreServer } from "@/src/shared/store/get-last-store-server";

export default async function RecoverPasswordResetPage() {
  const lastStore = await getLastStoreServer();

  return <RecoverPasswordRoute brandName={lastStore?.name} step="reset" />;
}
