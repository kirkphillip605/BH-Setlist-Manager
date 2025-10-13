/* eslint-env browser */

const getRuntimeEnv = () => {
  if (typeof window !== 'undefined' && window.__ENV__ && typeof window.__ENV__ === 'object') {
    return window.__ENV__;
  }

  return {};
};

export const getEnvVar = (key, defaultValue) => {
  const runtimeEnv = getRuntimeEnv();
  const runtimeValue = runtimeEnv[key];

  if (runtimeValue !== undefined && runtimeValue !== null && runtimeValue !== '') {
    return runtimeValue;
  }

  let viteEnv = {};
  try {
    viteEnv = import.meta.env || {};
  } catch (error) {
    viteEnv = {};
  }

  const viteValue = viteEnv[key];

  if (viteValue !== undefined && viteValue !== null && viteValue !== '') {
    return viteValue;
  }

  return defaultValue;
};
