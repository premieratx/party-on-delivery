import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomDeliveryCoverModal } from "@/components/custom-delivery/CustomDeliveryCoverModal";
import bgImage from "@/assets/old-fashioned-bg.jpg";

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

  const resolved = useMemo(() => {
    const title =
      overrideTitle ||
      (app?.start_screen_config as any)?.custom_title ||
      app?.start_screen_config?.title ||
      app?.app_name ||
      "Start";
    const subtitle =
      overrideSubtitle ||
      (app?.start_screen_config as any)?.custom_subtitle ||
      app?.start_screen_config?.subtitle ||
      "Exclusive concierge delivery";
    const logoUrl =
      overrideLogo ||
      app?.start_screen_config?.logo_url ||
      app?.logo_url ||
      undefined;
    const buttonText =
      (app?.start_screen_config as any)?.start_button_text ||
      "Order Now";
    const checklist = [
      (app?.start_screen_config as any)?.checklist_item_1 || "Locally Owned",
      (app?.start_screen_config as any)?.checklist_item_2 || "Same Day Delivery",
      (app?.start_screen_config as any)?.checklist_item_3 || "Cocktail Kits on Demand",
      (app?.start_screen_config as any)?.checklist_item_4 || "Private Event Specialists",
      (app?.start_screen_config as any)?.checklist_item_5 || "Delivering All Over Austin",
    ];
    return { title, subtitle, logoUrl, buttonText, checklist };
  }, [app, overrideLogo, overrideSubtitle, overrideTitle]);

  const goToAppTabs = () => {
    if (app?.app_slug) navigate(`/app/${app.app_slug}?step=tabs`);
    else navigate("/");
  };

  const goToMargaritas = () => {
    if (app?.app_slug) {
      navigate(`/app/${app.app_slug}?step=tabs&category=cocktails&productTitle=Spicy%20Margarita`);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">Loading start screen…</div>
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
    <main className="min-h-screen bg-background">
      <CustomDeliveryCoverModal
        open={true}
        onOpenChange={() => {}}
        onStartOrder={goToAppTabs}
        onSecondaryAction={goToMargaritas}
        appName={app.app_name}
        logoUrl={resolved.logoUrl}
        title={resolved.title}
        subtitle={resolved.subtitle}
        buttonText={resolved.buttonText}
        checklistItems={resolved.checklist}
        backgroundImageUrl={bgImage}
        secondaryButtonText="Margaritas Now"
      />
    </main>
  );
}
