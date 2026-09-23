import { FormProvider, useForm } from "react-hook-form";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TextInputField from "@/components/MUI/TextInputField";
import EmailField from "@/components/MUI/EmailField";
import NumericField from "@/components/MUI/NumericField";

export const Route = createFileRoute("/platform/settings")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") !== "PlatformAdmin") throw redirect({ to: "/platform/login" });
  },
  component: PlatformSettingsPage,
});

function PlatformSettingsPage() {
  type SettingsForm = { name: string; supportEmail: string; defaultTrial: string };
  const methods = useForm<SettingsForm>({ defaultValues: { name: "BizUno Platform", supportEmail: "support@bizuno.local", defaultTrial: "14" } });
  const values = methods.watch();
  return <PlatformShell><PageHeader title="Platform settings" description="Configure platform identity, support contact and tenant defaults." /><div className="grid gap-4 lg:grid-cols-3"><Card className="p-5 lg:col-span-2"><FormProvider {...methods}><form onSubmit={methods.handleSubmit(() => toast.success("Platform settings saved"))}><h2 className="font-semibold">Platform configuration</h2><p className="mt-1 text-sm text-muted-foreground">These settings apply across all tenant workspaces.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><TextInputField name="name" label="Platform name" inputType="alphabet" required /><EmailField name="supportEmail" label="Support email" required /><NumericField name="defaultTrial" label="Default trial period (days)" min={0} max={3650} required /><TextInputField name="currency" label="Default currency" inputType="all" value="INR (₹)" disabled /></div><Button type="submit" className="mt-5" size="sm"><Save className="size-4" /> Save changes</Button></form></FormProvider></Card><Card className="p-5"><h2 className="font-semibold">Tenant provisioning</h2><p className="mt-1 text-sm text-muted-foreground">New workspaces currently use frontend demo data. Backend provisioning can be connected later.</p><div className="mt-5 rounded-lg bg-muted p-4 text-sm"><p className="font-medium">Current default</p><p className="mt-1 text-muted-foreground">{values.defaultTrial}-day trial · {values.name}</p></div></Card></div></PlatformShell>;
}
