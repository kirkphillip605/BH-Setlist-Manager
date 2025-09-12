export const showToast = (message) => {
  if (typeof window !== 'undefined' && window.alert) {
    // Simple placeholder toast implementation
    window.alert(message);
  } else {
    console.log('Toast:', message);
  }
};
