// import { toast } from '@/hooks/use-toast';

/**
 * Centralized toast notification utilities
 */

export const showToast = {  success: (message, description = null) => {
    // toast({
    //   title: message,
    //   description,
    //   variant: "default",
    // });
  },
  error: (message, description = null) => {
    // toast({
    //   title: message,
    //   description,
    //   variant: "destructive",
    // });
  },

  info: (message, description = null) => {
    toast({
      title: message,
      description,
      variant: "default",
    });
  },

  loading: (message = "Loading...") => {
    toast({
      title: message,
      description: "Please wait...",
      variant: "default",
    });
  },

  // Common application toasts
  savedSuccessfully: (item = "Changes") => {
    showToast.success(`${item} saved successfully!`);
  },

  deletedSuccessfully: (item = "Item") => {
    showToast.success(`${item} deleted successfully!`);
  },

  networkError: () => {
    showToast.error("Network Error", "Please check your connection and try again.");
  },

  unauthorizedError: () => {
    showToast.error("Access Denied", "You don't have permission to perform this action.");
  },

  validationError: (message = "Please check your input") => {
    showToast.error("Validation Error", message);
  }
};

export default showToast;
