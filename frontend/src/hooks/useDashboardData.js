import { useState, useEffect, useCallback } from 'react'
import { dashboardApi } from '../api/client'
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://sap-cloud-analytics-aah0gbcrf3ckgefc.centralindia-01.azurewebsites.net/',
  // baseURL: 'http://127.0.0.1:8001',
  // Use a safer default for heavier backend computations.
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * useDashboardData — master hook.
 * Fetches the /data/query dashboard payload once on mount.
 * Returns { data, loading, error, refetch }.
 */
export function useDashboardData() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getDashboard()
      setData(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/**
 * usePaginatedData — generic hook for paginated API endpoints.
 * @param {Function} fetcher   — e.g. (params) => dashboardApi.getGroups(params)
 * @param {Object}   defaults  — default query params
 */
export function usePaginatedData(fetcher, defaults = {}) {
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [params, setParams]     = useState({ page: 1, per_page: 20, ...defaults })

  const load = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher(p)
      setRows(res.data)
      setTotal(res.total)
      setTotalPages(res.total_pages)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => { load(params) }, [params, load])

  const updateParams = useCallback((updates) => {
    setParams((prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }))
  }, [])

  return { rows, total, totalPages, loading, error, params, updateParams }
}

/**
 * useInsights — fetch AI insights on demand.
 */

async function getInsightsContext(sessionId, token) {
  const res = await api.post(
    "/data/query/ai",   // no localhost here
    {
      query_type: "cof_dashboard",
      session_id: sessionId,
      filters: {}
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,  // ✅ per-request header
      },
    }
  );

  return res.data;
}

async function generateInsights(context) {
  const res = await fetch(
    "https://dashboard-insight-hrf3cpafhxgsf7fz.centralindia-01.azurewebsites.net/poc/insights/exposures",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body:  JSON.stringify(context),
    }
  );

  if (!res.ok) throw new Error("Insights API failed");

  return res.json();
}

export function useInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);

       const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      const token = params.get("token");

      if (!sessionId || !token) {
        throw new Error("Missing session or token");
      }

    try {
   

      const context = await getInsightsContext(sessionId, token);
      const result = await generateInsights(context);

      setInsights(result);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { insights, loading, error, generate };
}