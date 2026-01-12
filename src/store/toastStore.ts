import { create } from 'zustand';
import { AlertColor } from '@mui/material';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
  showToast: (message: string, severity?: AlertColor) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  open: false,
  message: '',
  severity: 'info',
  showToast: (message: string, severity: AlertColor = 'info') => {
    set({ open: true, message, severity });
  },
  hideToast: () => {
    set({ open: false });
  },
}));
