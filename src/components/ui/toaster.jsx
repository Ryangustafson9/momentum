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
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast
          key={id}
          {...props}
          className={cn(
            'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-lg rounded-xl px-4 py-3 border border-zinc-200 dark:border-zinc-700',
            'transition-all duration-300 ease-in-out w-full max-w-sm'
          )}
        >
          <div className="grid gap-1">
            {title && (
              <ToastTitle className="font-semibold text-base">{title}</ToastTitle>
            )}
            {description && (
              <ToastDescription className="text-sm text-zinc-600 dark:text-zinc-400">
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
      <div className="fixed z-[100] inset-0 pointer-events-none flex flex-col items-end justify-end p-4 sm:p-6 space-y-2 sm:space-y-3">
        <ToastRenderer />
      </div>
      <ToastViewport className="hidden" />
    </ToastProvider>
  );
}


