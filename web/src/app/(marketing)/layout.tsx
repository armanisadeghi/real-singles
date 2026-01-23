import { Header, Footer } from "@/components/layout";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 pt-[var(--header-height)]">{children}</main>
      <Footer />
    </div>
  );
}
