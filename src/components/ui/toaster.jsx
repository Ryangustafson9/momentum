import React from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast.js';
import { cn } from '@/lib/utils'; // Optional: class name utility (if you use one)

function ToastRenderer() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast
          key={id}
          {...props}
          className={cn(
            'shadow-lg rounded-xl px-4 py-3 border transition-all duration-300 ease-in-out w-full max-w-sm pointer-events-auto',
            variant === 'destructive'
              ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100'
              : variant === 'success'
              ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100'
              : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700'
          )}
        >
          <div className="grid gap-1">
            {title && (
              <ToastTitle className="font-semibold text-base">{title}</ToastTitle>
            )}
            {description && (
              <ToastDescription className={cn(
                "text-sm",
                variant === 'destructive'
                  ? 'text-red-700 dark:text-red-300'
                  : variant === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-zinc-600 dark:text-zinc-400'
              )}>
                {description}
              </ToastDescription>
            )}
          </div>
          {action}
          <ToastClose className="ml-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition" />
        </Toast>
      ))}
    </>
  );
}

export function Toaster() {
  return (
    <ToastProvider>
      <div className="fixed z-[100] bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-none flex flex-col items-center justify-end space-y-2 sm:space-y-3 max-w-sm w-full" style={{ marginLeft: '8rem' }}>
        <ToastRenderer />
      </div>
      <ToastViewport />
    </ToastProvider>
  );
}



