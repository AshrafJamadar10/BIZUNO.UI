import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import WebsiteHomePage from '@/utils/FormHandling/WebsiteForm';

export const Route = createFileRoute('/website')({
  component: WebsiteRoute,
});

function WebsiteRoute() {
  return (
    <AppShell>
      <WebsiteHomePage formKey="website" />
    </AppShell>
  );
}