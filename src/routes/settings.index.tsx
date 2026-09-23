import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { TextField } from "@mui/material";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings/")({ component: SettingsPage });
function SettingsPage() {
  const [company, setCompany] = useState("Nexus Traders Pvt Ltd"); const [email, setEmail] = useState("accounts@nexustraders.in"); const [notifications, setNotifications] = useState(true);
  return <AppShell><PageHeader title="Settings" description="Configure your workspace, company details and notifications." crumbs={[{ label: "Home", to: "/" }, { label: "Settings" }]} /><div className="grid gap-4 lg:grid-cols-3"><Card className="p-5 lg:col-span-2"><h2 className="font-semibold">Company profile</h2><p className="mt-1 text-sm text-muted-foreground">These details appear on invoices and reports.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><TextField label="Company name" className="mt-1.5" value={company} onChange={(e) => setCompany(e.target.value)} /></div><div><TextField label="Accounts email" className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div><TextField label="Currency" className="mt-1.5" value="INR (₹)" disabled /></div><div><TextField label="Financial year" className="mt-1.5" value="April - March" disabled /></div></div><Button className="mt-5" onClick={() => toast.success("Settings saved")}><Save className="size-4" /> Save changes</Button></Card><Card className="p-5"><h2 className="font-semibold">Notifications</h2><p className="mt-1 text-sm text-muted-foreground">Choose which workspace alerts you receive.</p><div className="mt-5 flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Email notifications</p><p className="text-xs text-muted-foreground">Low stock and payment reminders</p></div><button type="button" role="switch" aria-checked={notifications} onClick={() => setNotifications((value) => !value)} className={`relative h-6 w-11 rounded-full transition-colors ${notifications ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${notifications ? "translate-x-6" : "translate-x-1"}`} /></button></div></Card></div></AppShell>;
}
