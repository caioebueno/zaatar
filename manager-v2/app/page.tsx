import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TOKEN_COOKIE } from "./lib/auth";

export default async function Home() {
  const store = await cookies();
  redirect(store.get(TOKEN_COOKIE)?.value ? "/orders" : "/login");
}
