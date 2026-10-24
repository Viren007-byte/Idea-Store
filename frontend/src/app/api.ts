import axios from 'axios'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1', withCredentials: true, timeout: 15000 })
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : 'Cannot reach the server. Please try again.')
  }
  return error instanceof Error ? error.message : 'Something went wrong'
}
