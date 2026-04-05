import PendingOrderAlert from "@/app/components/PendingOrderAlert";

export default async function MenuLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{
    lg: string;
  }>;
}>) {
  const { lg } = await params;

  return (
    <div className="min-h-dvh flex flex-col">
      <PendingOrderAlert lg={lg} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
