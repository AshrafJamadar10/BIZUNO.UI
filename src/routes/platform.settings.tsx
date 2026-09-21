import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/platform/settings")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/admin/login" });
  },
  component: PlatformSettingsPage,
});

function PlatformSettingsPage() {
  const [name, setName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [defaultTrial, setDefaultTrial] = useState("");
  return <PlatformShell><PageHeader title="Platform settings" description="Configure platform identity, support contact and tenant defaults." /><div className="grid gap-4 lg:grid-cols-3"><Card className="p-5 lg:col-span-2"><h2 className="font-semibold">Platform configuration</h2><p className="mt-1 text-sm text-muted-foreground">These settings apply across all tenant workspaces.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Label>Platform name</Label><Input className="mt-1.5" value={name} onChange={(event) => setName(event.target.value)} /></div><div><Label>Support email</Label><Input className="mt-1.5" type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} /></div><div><Label>Default trial period (days)</Label><Input className="mt-1.5" type="number" min="0" value={defaultTrial} onChange={(event) => setDefaultTrial(event.target.value)} /></div><div><Label>Default currency</Label><Input className="mt-1.5" value="INR (₹)" disabled /></div></div><Button className="mt-5" onClick={() => toast.success("Platform settings saved")}><Save className="size-4" /> Save changes</Button></Card><Card className="p-5"><h2 className="font-semibold">Tenant provisioning</h2><p className="mt-1 text-sm text-muted-foreground">New workspaces currently use frontend demo data. Backend provisioning can be connected later.</p><div className="mt-5 rounded-lg bg-muted p-4 text-sm"><p className="font-medium">Current default</p><p className="mt-1 text-muted-foreground">{defaultTrial}-day trial · {name}</p></div></Card></div></PlatformShell>;
}
