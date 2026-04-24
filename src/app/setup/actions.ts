"use server";

import { redirect } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";

type SetupState = { error: string };

function mustBeDev() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Setup is only available in development.");
  }
}

export async function saveSupabaseEnv(_: SetupState, formData: FormData): Promise<SetupState> {
  try {
    mustBeDev();

    const url = String(formData.get("url") ?? "").trim();
    const anonKey = String(formData.get("anonKey") ?? "").trim();

    if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
      return { error: "Enter a valid Supabase project URL (https://...supabase.co)." };
    }
    if (anonKey.length < 20) {
      return { error: "Enter a valid Supabase anon key." };
    }

    const envPath = path.join(process.cwd(), ".env.local");
    const content =
      `NEXT_PUBLIC_SUPABASE_URL=${url}\n` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n`;

    await fs.writeFile(envPath, content, { encoding: "utf8" });

    redirect("/setup?saved=1");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Setup failed." };
  }
}

