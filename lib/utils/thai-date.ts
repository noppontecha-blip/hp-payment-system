const BE_OFFSET = 543;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Parse a Postgres `date` string ("yyyy-mm-dd") into a local Date without timezone shift. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date (or ISO date string) into dd/mm/yyyy using the Buddhist Era year. */
export function formatThaiDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? parseISODate(value) : value;
  const beYear = date.getFullYear() + BE_OFFSET;
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${beYear}`;
}

/** Convert a Date to the "yyyy-mm-dd" string Postgres `date` columns expect (local, no UTC shift). */
export function toISODateString(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toBEYear(adYear: number): number {
  return adYear + BE_OFFSET;
}

export function toADYear(beYear: number): number {
  return beYear - BE_OFFSET;
}
