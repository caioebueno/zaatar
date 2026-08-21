import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TOKEN_COOKIE } from "../lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const store = await cookies();
  if (store.get(TOKEN_COOKIE)?.value) {
    redirect("/orders");
  }
  return <LoginForm />;
}
