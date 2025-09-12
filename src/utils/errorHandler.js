import { showToast } from './toast';

export const logError = (error, context = {}) => {
  console.error('Error:', { message: error.message, stack: error.stack, context });
};

export const handleError = (error, userMessage = 'An unexpected error occurred.') => {
  logError(error);
  showToast(userMessage);
};
