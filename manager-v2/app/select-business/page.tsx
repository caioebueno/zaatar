import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TOKEN_COOKIE } from "../lib/auth";
import { SelectBusiness } from "./SelectBusiness";

export default async function SelectBusinessPage() {
  const store = await cookies();
  if (!store.get(TOKEN_COOKIE)?.value) {
    redirect("/login");
  }
  return <SelectBusiness />;
}
