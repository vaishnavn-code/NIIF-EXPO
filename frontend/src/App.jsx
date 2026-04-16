import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Overview from './pages/Overview'
import Exposure from './pages/Exposure'
import Rates from './pages/Rates'
import Borrowers from './pages/Borrowers'
import Transactions from './pages/Transactions'
import { Spinner, ErrorMsg } from './components/ui/helpers'
import { useDashboardData } from './hooks/useDashboardData'
import mockData from './data/mockOverview.json'

const PAGE_TITLES = {
  overview:     'Portfolio Overview',
  exposure:     'Exposure Analytics',
  rates:        'Interest Rate & Tenor Analysis',
  borrowers:    'Borrower / Customer View',
  transactions: 'Transaction Analytics',
}

export default function App() {
  const [page, setPage]       = useState('overview')
  const [darkMode, setDark]   = useState(false)
  const { data, loading, error } = useDashboardData()

  const toggleDark = () => {
    const next = !darkMode
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
  }

  const renderPage = () => {
    if (!data) return null
    
    const computed = {
      total_records: data.row_count,
      unique_proposals: 0, // placeholder
      unique_groups: data.render_state.totals.lv_grp_cnt,
      unique_customers: data.render_state.totals.lv_cust_cnt,
      min_rate: 0, // placeholder
      max_rate: 0, // placeholder
      avg_rate: 0, // placeholder
    }
    
    switch (page) {
      case 'overview':     return <Overview     data={mockData} />
      case 'exposure':     return <Exposure     computed={computed} />
      case 'rates':        return <Rates        data={data} />
      case 'borrowers':    return <Borrowers    computed={computed} />
      case 'transactions': return <Transactions data={data} />
      default:             return null
    }
  }

  return (
    <div className="app-wrapper">
      <Sidebar activePage={page} onNavigate={setPage} />

      <div className="main-area">
        <Header
          title={PAGE_TITLES[page]}
          darkMode={darkMode}
          onToggleDark={toggleDark}
        />

        <div className="page-content">
          {loading && <Spinner />}
          {error   && <ErrorMsg message={error} />}
          {!loading && !error && renderPage()}
        </div>
      </div>
    </div>
  )
}
