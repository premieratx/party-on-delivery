import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AppRecord {
  app_name: string;
  app_slug: string;
  logo_url?: string | null;
  start_screen_config?: {
    title?: string;
    subtitle?: string;
    logo_url?: string;
    custom_title?: string;
    custom_subtitle?: string;
    start_button_text?: string;
    checklist_item_1?: string;
    checklist_item_2?: string;
    checklist_item_3?: string;
    primary_color?: string;
  } | null;
}

export default function StartScreenPreview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const appSlug = searchParams.get("app");

  // Optional quick overrides for design iteration via URL params
  const overrideTitle = searchParams.get("title") || undefined;
  const overrideSubtitle = searchParams.get("subtitle") || undefined;
  const overrideLogo = searchParams.get("logo") || undefined;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (appSlug) {
          const { data, error } = await supabase
            .from("delivery_app_variations")
            .select("app_name, app_slug, logo_url, start_screen_config")
            .eq("app_slug", appSlug)
            .maybeSingle();
          if (!error && data) setApp(data as unknown as AppRecord);
          else setApp(null);
        } else {
          // Fallback: use the app marked as homepage
          const { data, error } = await supabase
            .from("delivery_app_variations")
            .select("app_name, app_slug, logo_url, start_screen_config")
            .eq("is_homepage", true)
            .maybeSingle();
          if (!error && data) setApp(data as unknown as AppRecord);
          else setApp(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appSlug]);

  useEffect(() => {
    if (!loading) {
      if (app?.app_slug) {
        navigate(`/app/${app.app_slug}?step=tabs`, { replace: true });
      }
    }
  }, [loading, app, navigate]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Loading…</div>
      </main>
    );
  }

  if (!app) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-destructive">No app found. Provide ?app=your-app-slug or set a homepage app.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center">
      <div className="text-muted-foreground">Redirecting…</div>
    </main>
  );
}
