import { createFileRoute } from '@tanstack/react-router';
import Dashboard from '@/utils/FormHandling/FormBuilder';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});