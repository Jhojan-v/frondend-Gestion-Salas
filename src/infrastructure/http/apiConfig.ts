const DEFAULT_DEV_BACKEND_URL = 'http://localhost:8080'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') || ''

export const LOCAL_FALLBACK_ENABLED = import.meta.env.VITE_ENABLE_LOCAL_FALLBACK === 'true'

function resolveBackendBaseLabel() {
  if (API_BASE_URL) {
    return API_BASE_URL
  }

  if (typeof window !== 'undefined') {
    return new URL('/api', window.location.origin).toString().replace(/\/$/, '')
  }

  return DEFAULT_DEV_BACKEND_URL
}

export const getBackendUnavailableMessage = () =>
  `No fue posible conectar con el backend en ${resolveBackendBaseLabel()}.`
