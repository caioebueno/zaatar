import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "./_components/AppSidebar";
import { BUSINESS_COOKIE, TOKEN_COOKIE } from "../lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  if (!store.get(TOKEN_COOKIE)?.value) {
    redirect("/login");
  }
  if (!store.get(BUSINESS_COOKIE)?.value) {
    redirect("/select-business");
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "#202020",
        overflow: "hidden",
      }}
    >
      <AppSidebar />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "#202020",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
