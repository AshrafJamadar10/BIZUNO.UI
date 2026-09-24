import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import FormBuilderPage from '@/utils/FormHandling/FormBuilder';

export const Route = createFileRoute('/forms')({
  component: FormsRoute,
});

function FormsRoute() {
  return (
    <AppShell>
      <FormBuilderPage />
    </AppShell>
  );
}