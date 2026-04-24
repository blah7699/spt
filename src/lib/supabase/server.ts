import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";

  if ((!url || !anonKey) && !isBuild) {
    throw new Error(
      "Supabase is not configured. Go to /setup to create .env.local, then restart the dev server."
    );
  }
  const cookieStore = await cookies();

  return createServerClient(
    url ?? "http://localhost:0000",
    anonKey ?? "missing",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can't always set cookies; middleware refresh covers it.
          }
        },
      },
    }
  );
}

