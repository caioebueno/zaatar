import type { ReactNode } from "react";
import ManagerShell from "../components/ManagerShell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ManagerShell>{children}</ManagerShell>;
}
