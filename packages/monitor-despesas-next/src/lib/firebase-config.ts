
export interface Config {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

const Config: Config = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: ''
}

let firebaseConfigured = false

export function initialize(): null {
  console.warn('⚠️ [] DESABILITADO - Sistema usa cache local agora')
  return null
}

function validateConfig(): boolean {
  return false
}

export const getInstance = () => null
export const getAuthInstance = () => null
export const isConfigured = () => false
export const getStatus = () => ({
  connected: false,
  error: ' desabilitado - usando cache local'
})
export const testConnection = () => Promise.resolve(false)

console.log('📦 [CacheLocal]  desabilitado - sistema usa cache local')

const firebaseConfig = {
  initialize,
  getInstance,
  getAuthInstance,
  isConfigured,
  getStatus,
  testConnection
}

export default firebaseConfig