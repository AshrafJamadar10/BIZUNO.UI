import * as React from 'react';
import { Alert, Snackbar } from '@mui/material';

export type SnackbarVariant = 'success' | 'error' | 'info' | 'warning';

type SnackbarMessage = {
  id: string;
  message: string;
  variant: SnackbarVariant;
};

type SnackbarContextValue = {
  showSnackbar: (message: string, variant?: SnackbarVariant) => void;
};

const SnackbarContext = React.createContext<SnackbarContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAppSnackbar() {
  const ctx = React.useContext(SnackbarContext);
  if (!ctx) throw new Error('useAppSnackbar must be used within SnackbarProvider');
  return ctx;
}

function uid() {
  return `snk_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<SnackbarMessage[]>([]);
  const [open, setOpen] = React.useState(false);

  const current = queue[0];

  const showSnackbar = React.useCallback((message: string, variant: SnackbarVariant = 'info') => {
    setQueue((q) => [...q, { id: uid(), message, variant }]);
    setOpen(true);
  }, []);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleExited = () => {
    setQueue((q) => q.slice(1));
    if (queue.length > 1) setOpen(true);
  };

  const value = React.useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
     <Snackbar
  key={current?.id}
  open={open && Boolean(current)}
  autoHideDuration={3500}
  onClose={handleClose}
  slotProps={{ transition: { onExited: handleExited } }}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
        {current ? (
          <Alert onClose={handleClose} severity={current.variant} variant="filled" sx={{ width: '100%' }}>
            {current.message}
          </Alert>
        ) : (
          <Alert severity="info" variant="filled" sx={{ width: '100%' }}>
            {/* never shown; keeps component stable */}
            Ready
          </Alert>
        )}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

