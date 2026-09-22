import { createFileRoute } from '@tanstack/react-router';
import Dashboard from '@/utils/FormBuilder';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});