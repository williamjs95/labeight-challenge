import { QuoteApp } from "@/components/QuoteApp";
import { isValidIsoDate, toIsoDate } from "@/lib/transforms/dates";

// Age checks depend on today's date, so don't prerender at build time.
export const dynamic = "force-dynamic";

interface PageProps {
  // `?today=YYYY-MM-DD` pins the date for demos and e2e tests.
  searchParams: Promise<{ today?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { today: param } = await searchParams;
  const today =
    typeof param === "string" && isValidIsoDate(param)
      ? param
      : toIsoDate(new Date());

  return (
    <main>
      <h1>Renters quote: Harbor Assurance</h1>
      <QuoteApp today={today} />
    </main>
  );
}
