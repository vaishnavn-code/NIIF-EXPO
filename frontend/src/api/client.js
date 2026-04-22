import axios from 'axios'
// import dashboardSeed from '../data/dashboardSeed.json'

const api = axios.create({
  baseURL: 'https://sap-cloud-analytics-aah0gbcrf3ckgefc.centralindia-01.azurewebsites.net/',
  // baseURL: 'http://127.0.0.1:8001',
  // Use a safer default for heavier backend computations.
  timeout: 90000,
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
  // const sharedSecret = 'CHANGE_ME_IN_PRODUCTION'
  const sharedSecret = '658ebbd2998e6e43dee75b64d23dc3f075a8a1bdfc08fa5fb85eba457e8782b6'
  // const sharedSecret = Environment.GetEnvironmentVariable("sharedSecret")
  // console.log("Using shared secret:", sharedSecret);

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
    const params = new URLSearchParams(window.location.search);

    const sessionId = params.get("session_id");
    const token = params.get("token");

    if (!sessionId || !token) {
      throw new Error("Missing session_id or token in URL");
    }

    return api.post(
      "/data/query",
      {
        "query_type": "cof_dashboard",
        session_id: sessionId,
        
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};

export default api
