'use client'

import { toaster } from '@/components/ui/toaster';

export function useAppToast() {
  const showSuccess = (title: string, description?: string) => {
    toaster.create({
      title,
      description,
      type: 'success',
      duration: 3000,
    });
  };

  const showError = (title: string, description?: string) => {
    toaster.create({
      title,
      description,
      type: 'error',
      duration: 4000,
    });
  };

  const showInfo = (title: string, description?: string) => {
    toaster.create({
      title,
      description,
      type: 'info',
      duration: 3000,
    });
  };

  const showWarning = (title: string, description?: string) => {
    toaster.create({
      title,
      description,
      type: 'warning',
      duration: 3500,
    });
  };

  return { showSuccess, showError, showInfo, showWarning };
}
