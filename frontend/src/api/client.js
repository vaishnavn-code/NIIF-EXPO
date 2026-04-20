import axios from 'axios'
import dashboardSeed from '../data/dashboardSeed.json'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'API error'
    return Promise.reject(new Error(msg))
  }
)

async function computeHmacSha256(secret, message) {
  if (!window?.crypto?.subtle) {
    throw new Error('Browser crypto is required for auth generation')
  }

  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await window.crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  )

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function getDevToken() {
  const sapSid = 'DEV'
  const sapClient = '100'
  const sapUser = 'dev_user'
  const timestamp = Math.floor(Date.now() / 1000)
  const message = `${sapSid}${sapClient}${timestamp}`
  const sharedSecret = 'CHANGE_ME_IN_PRODUCTION'

  const hmac_sig = await computeHmacSha256(sharedSecret, message)

  return api.post('/auth/token', {
    sap_sid: sapSid,
    sap_client: sapClient,
    sap_user: sapUser,
    timestamp,
    hmac_sig,
  })
}

export const dashboardApi = {
  getDashboard: async () => {
    const tokenResponse = await getDevToken()
    const accessToken = tokenResponse.access_token

    return api.post(
      '/data/query',
      {
        query_type: 'cof_dashboard',
        raw_data: dashboardSeed,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
  },

  // getGroups: (params = {}) => api.get('/groups', { params }),

  // getCustomers: (params = {}) => api.get('/customers', { params }),

  // getTransactions: (params = {}) => api.get('/transactions', { params }),

  // getInsightsContext: () => api.get('/insights/context'),

  // generateInsights: (context) => api.post('/insights', { context }),
}

export default api
