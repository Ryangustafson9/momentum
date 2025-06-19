import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Toast action types
const TOAST_ACTIONS = {
  ADD_TOAST: 'ADD_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
};

// Toast reducer
const toastReducer = (state, action) => {
  switch (action.type) {
    case TOAST_ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 3), // Limit to 3 toasts
      };
    case TOAST_ACTIONS.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case TOAST_ACTIONS.DISMISS_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t
        ),
      };
    case TOAST_ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

// Create context
const ToastContext = createContext(null);

// Toast ID counter
let toastIdCounter = 0;

// Toast timeouts map
const toastTimeouts = new Map();

// Toast provider component
export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  // Add toast to remove queue
  const addToRemoveQueue = useCallback((toastId) => {
    if (toastTimeouts.has(toastId)) {
      return;
    }

    const timeout = setTimeout(() => {
      toastTimeouts.delete(toastId);
      dispatch({
        type: TOAST_ACTIONS.REMOVE_TOAST,
        toastId,
      });
    }, 5000); // 5 seconds

    toastTimeouts.set(toastId, timeout);
  }, []);

  // Toast function
  const toast = useCallback(({ ...props }) => {
    const id = (++toastIdCounter).toString();

    const update = (props) =>
      dispatch({
        type: TOAST_ACTIONS.UPDATE_TOAST,
        toast: { ...props, id },
      });

    const dismiss = () => {
      dispatch({ type: TOAST_ACTIONS.DISMISS_TOAST, toastId: id });
      addToRemoveQueue(id);
    };

    dispatch({
      type: TOAST_ACTIONS.ADD_TOAST,
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss();
        },
      },
    });

    addToRemoveQueue(id);

    return {
      id,
      dismiss,
      update,
    };
  }, [addToRemoveQueue]);

  // Dismiss function
  const dismiss = useCallback((toastId) => {
    dispatch({ type: TOAST_ACTIONS.DISMISS_TOAST, toastId });
    addToRemoveQueue(toastId);
  }, [addToRemoveQueue]);

  const value = {
    ...state,
    toast,
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// Custom hook to use toast context
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}
