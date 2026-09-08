import { getSettings } from "@/lib/data/settings";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings — Admin" };

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted mb-1">Admin</p>
        <h1 className="font-display text-3xl font-light text-text">Settings</h1>
        <p className="font-body text-sm text-text-muted mt-2">
          Global store configuration. Changes apply immediately — no deploy required.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
