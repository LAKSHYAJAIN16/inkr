import { headers } from "next/headers";

export async function absoluteUrl(pathname: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  return new URL(pathname, base).toString();
}


