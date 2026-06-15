import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { authService } from '../services/auth'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  
  // Settings States (Fetched/Saved to Backend)
  const [accessWebsites, setAccessWebsites] = useState(['youtube.com', 'reddit.com', 'twitter.com', 'medium.com', 'wikipedia.org'])
  const [newSite, setNewSite] = useState('')
  const [focusBlocked, setFocusBlocked] = useState(['instagram.com', 'tiktok.com'])
  const [newBlock, setNewBlock] = useState('')
  const [focusMode, setFocusMode] = useState(false)
  
  // Feedback States
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSuccess, setFeedbackSuccess] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  
  // Chart Period & Selection Indices
  const [chartPeriod, setChartPeriod] = useState('weekly')
  const [weeklyIndex, setWeeklyIndex] = useState(6) // Default to Sunday
  const [monthlyIndex, setMonthlyIndex] = useState(3) // Default to Week 4

  // Collapsible Activity Details state
  const [expandedActivityId, setExpandedActivityId] = useState(null)

  // Real Backend Aggregated Data State
  const [dashboardData, setDashboardData] = useState({
    today: { score: 0, label: 'No Data Yet', breakdown: [] },
    topWebsites: [],
    suggestions: [],
    improvements: [],
    weeklyData: [],
    monthlyData: [],
    activities: []
  })
  const [loading, setLoading] = useState(true)

  // Fetch stats from backend
  const fetchDashboardData = async () => {
    try {
      const token = authService.getToken()
      const res = await fetch("http://localhost:5000/api/activity/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (data && data.today) {
        setDashboardData(data)
      }
    } catch (e) {
      console.error("Error fetching dashboard statistics:", e)
    }
  }

  // Fetch settings from backend
  const fetchSettings = async () => {
    try {
      const token = authService.getToken()
      const res = await fetch("http://localhost:5000/api/activity/settings", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      if (data) {
        setAccessWebsites(data.trackedWebsites || [])
        setFocusBlocked(data.blockedWebsites || [])
        setFocusMode(data.focusMode || false)
      }
    } catch (e) {
      console.error("Error fetching settings:", e)
    }
  }

  useEffect(() => {
    const u = authService.getCurrentUser()
    if (!u) { navigate('/auth'); return }
    setUser(u)

    Promise.all([fetchDashboardData(), fetchSettings()])
      .finally(() => setLoading(false))

    // Poll for changes every 5 seconds for responsive dashboard updates
    const interval = setInterval(fetchDashboardData, 5000)
    return () => clearInterval(interval)
  }, [navigate])

  // Save updated settings back to the backend
  const saveSettings = async (newTracked, newBlocked, newFocusVal) => {
    try {
      const token = authService.getToken()
      await fetch("http://localhost:5000/api/activity/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          trackedWebsites: newTracked,
          blockedWebsites: newBlocked,
          focusMode: newFocusVal
        })
      })
    } catch (e) {
      console.error("Error updating settings:", e)
    }
  }

  const handleLogout = () => { authService.logout(); navigate('/') }

  const addSite = () => {
    if (newSite.trim()) {
      const updated = [...accessWebsites, newSite.trim().toLowerCase()]
      setAccessWebsites(updated)
      setNewSite('')
      saveSettings(updated, focusBlocked, focusMode)
    }
  }

  const removeSite = (s) => {
    const updated = accessWebsites.filter(x => x !== s)
    setAccessWebsites(updated)
    saveSettings(updated, focusBlocked, focusMode)
  }

  const addBlock = () => {
    if (newBlock.trim()) {
      const updated = [...focusBlocked, newBlock.trim().toLowerCase()]
      setFocusBlocked(updated)
      setNewBlock('')
      saveSettings(accessWebsites, updated, focusMode)
    }
  }

  const removeBlock = (s) => {
    const updated = focusBlocked.filter(x => x !== s)
    setFocusBlocked(updated)
    saveSettings(accessWebsites, updated, focusMode)
  }

  const toggleFocusMode = () => {
    const nextVal = !focusMode
    setFocusMode(nextVal)
    saveSettings(accessWebsites, focusBlocked, nextVal)
  }

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return
    setFeedbackLoading(true)
    setFeedbackSuccess('')
    try {
      const token = authService.getToken()
      const res = await fetch("http://localhost:5000/api/activity/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ feedbackText: feedbackText.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setFeedbackSuccess("Thank you for your feedback!")
        setFeedbackText("")
      } else {
        setFeedbackSuccess(data.message || "Failed to submit feedback. Try again.")
      }
    } catch (e) {
      setFeedbackSuccess("Failed to submit feedback.")
      console.error(e)
    } finally {
      setFeedbackLoading(false)
    }
  }

  const toggleActivityDetails = (id) => {
    setExpandedActivityId(expandedActivityId === id ? null : id)
  }

  if (!user) return null

  const scoreColor = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

  // Safe data extraction variables
  const todayScore = dashboardData.today?.score ?? 0
  const todayLabel = dashboardData.today?.label || 'No Data Yet'
  const todayBreakdown = dashboardData.today?.breakdown || []
  const topWebsites = dashboardData.topWebsites || []
  const suggestions = dashboardData.suggestions || []
  const improvements = dashboardData.improvements || []
  const weeklyList = dashboardData.weeklyData || []
  const monthlyList = dashboardData.monthlyData || []
  const todayActivities = dashboardData.activities || []

  // Safe selection metrics
  const selectedWeekly = weeklyList[weeklyIndex] || { day: 'None', score: 0, focus: '0s', distracted: '0s', topSite: 'None' }
  const selectedMonthly = monthlyList[monthlyIndex] || { day: 'None', score: 0, focus: '0s', distracted: '0s', topSite: 'None' }

  return (
    <div className="dash">
      {/* Navbar */}
      <nav className="dash-nav">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-white/20 via-sky-200/20 to-violet-200/20 p-[1px] flex items-center justify-center shadow-glow-blue animate-pulse-slow">
            <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-brand-cyan" />
            </div>
          </div>
          <span className="font-heading text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            VeritasFlow
          </span>
        </Link>
        <div className="dash-nav-right">
          <span className="dash-user-pill">👤 {user.username}</span>
          <button className="dash-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Main Layout containing Sidebar and Main Content Panels */}
      <div className="dash-layout">
        
        {/* Sidebar (User profile, Tracked site input, Focus blocking) */}
        <aside className="dash-sidebar">
          {/* User Score Card */}
          <div className="sidebar-card sidebar-user">
            <div className="user-avatar-row">
              <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
              <div>
                <h3>{user.username}</h3>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
            
            <div className="pie-wrapper">
              <svg viewBox="0 0 120 120" className="pie-svg">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e6e6e2" strokeWidth="9" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" strokeWidth="9"
                  strokeDasharray={`${todayScore * 3.14} 314`} strokeLinecap="round"
                  transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1.5s ease' }} />
              </svg>
              <div className="pie-center">
                <span className="pie-score">{todayScore}</span>
                <span className="pie-label">Diet Score</span>
              </div>
            </div>
          </div>

          {/* Tracked websites Settings */}
          <div className="sidebar-card tracking-sites-card">
            <h4>🌐 Website Access</h4>
            <p className="sidebar-hint">Only activity on these websites will be tracked.</p>
            <div className="site-input-row">
              <input placeholder="Add site..." value={newSite} onChange={e => setNewSite(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSite()} />
              <button onClick={addSite}>+</button>
            </div>
            <div className="site-list">
              {accessWebsites.map(s => (
                <div className="site-tag" key={s}>
                  <span>{s}</span>
                  <button onClick={() => removeSite(s)}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Mode Settings */}
          <div className="sidebar-card focus-block-card">
            <div className="focus-header">
              <h4>🎯 Focus Block</h4>
              <button className={`focus-toggle ${focusMode ? 'on' : ''}`} onClick={toggleFocusMode}>
                {focusMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <p className="sidebar-hint">These websites are blocked during Focus Mode.</p>
            <div className="site-input-row">
              <input placeholder="Block site..." value={newBlock} onChange={e => setNewBlock(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addBlock()} />
              <button onClick={addBlock}>+</button>
            </div>
            <div className="site-list">
              {focusBlocked.map(s => (
                <div className="site-tag site-tag-block" key={s}>
                  <span>{s}</span>
                  <button onClick={() => removeBlock(s)}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Card */}
          <div className="sidebar-card feedback-card">
            <h4>💬 Share Feedback</h4>
            <p className="sidebar-hint">Your feedback will be displayed publicly on the homepage!</p>
            <textarea 
              placeholder="Tell us what you think..." 
              value={feedbackText} 
              onChange={e => setFeedbackText(e.target.value)} 
              rows={3}
              style={{ 
                width: '100%', 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                padding: '8px', 
                color: 'var(--text-primary)', 
                fontSize: '12px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
            <button 
              onClick={submitFeedback} 
              disabled={feedbackLoading || !feedbackText.trim()}
              className="dash-feedback-btn"
              style={{
                background: 'white',
                color: '#0c0c0e',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                opacity: (!feedbackText.trim() || feedbackLoading) ? 0.5 : 1
              }}
            >
              {feedbackLoading ? "Submitting..." : "Submit Feedback"}
            </button>
            {feedbackSuccess && (
              <p style={{ 
                fontSize: '11px', 
                color: feedbackSuccess.includes("Thank") ? '#10b981' : '#ef4444', 
                marginTop: '4px',
                fontWeight: '500'
              }}>
                {feedbackSuccess}
              </p>
            )}
          </div>
        </aside>

        {/* Main Content Area: Grouped in two columns to align bottom boundaries */}
        <main className="dash-main">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--accent)' }}>
              <h3>Loading Dashboard Data...</h3>
            </div>
          ) : (
            <>
              <div className="dash-col">
                {/* Today's Diet Score Breakdown */}
                <div className="panel-card metrics-card">
                  <h4>📊 Today's Metrics</h4>
                  <div className="score-label-tag" style={{ color: scoreColor(todayScore) }}>
                    Today's Score: {todayScore}/100 ({todayLabel})
                  </div>
                  <div className="breakdown">
                    {todayBreakdown.map((b, i) => (
                      <div className="breakdown-row" key={i}>
                        <span className="breakdown-name">{b.name}</span>
                        <div className="breakdown-bar">
                          <div className="breakdown-fill" style={{ width: `${b.val}%` }} />
                        </div>
                        <span className="breakdown-val">{b.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Activity Details Log with More Details functionality */}
                <div className="panel-card top-sites-card activity-log-card">
                  <h4>🔍 Daily Content consumption (Details)</h4>
                  <p className="sidebar-hint" style={{ marginBottom: '12px' }}>Click "More Details" to see deep AI insights on content consumed today.</p>
                  
                  <div className="top-sites" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {todayActivities.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>
                        No content tracked yet today. Make sure to stay on a site for more than 3 mins to record!
                      </div>
                    ) : (
                      todayActivities.map((act) => {
                        const isExpanded = expandedActivityId === act.id;
                        const durationMins = Math.floor(act.duration / 60);
                        const durationSecs = act.duration % 60;
                        const durationStr = durationMins > 0 ? `${durationMins}m ${durationSecs}s` : `${durationSecs}s`;
                        
                        return (
                          <div key={act.id} className="activity-item-box" style={{ 
                            border: '1px solid var(--border)', 
                            borderRadius: '8px', 
                            padding: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{act.title}</h5>
                                <span style={{ fontSize: '11px', color: 'var(--accent)', marginRight: '10px' }}>{act.domain}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Spent: {durationStr}</span>
                              </div>
                              <button 
                                onClick={() => toggleActivityDetails(act.id)}
                                style={{ 
                                  background: 'none', 
                                  border: '1px solid var(--accent)', 
                                  borderRadius: '4px', 
                                  color: 'var(--accent)', 
                                  fontSize: '11px', 
                                  padding: '4px 8px', 
                                  cursor: 'pointer' 
                                }}
                              >
                                {isExpanded ? "Less Details" : "More Details"}
                              </button>
                            </div>

                            {/* Expanded Details section */}
                            {isExpanded && act.analysis && (
                              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                  <strong>Sentiment:</strong> <span style={{ color: act.analysis.sentiment === 'Positive' ? '#34d399' : act.analysis.sentiment === 'Negative' ? '#f87171' : 'var(--text-secondary)' }}>{act.analysis.sentiment || 'Neutral'}</span>
                                </div>
                                <div>
                                  <strong>Category:</strong> <span>{act.analysis.contentCategory || 'General'}</span>
                                </div>
                                <div>
                                  <strong>Diet Score:</strong> <span style={{ color: scoreColor(act.analysis.learningScore) }}>{act.analysis.learningScore || 50}/100</span>
                                </div>
                                <div>
                                  <strong>AI Summary:</strong> <p style={{ color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.4' }}>{act.analysis.summary}</p>
                                </div>
                                <div>
                                  <strong>Key Learnings:</strong>
                                  <ul style={{ paddingLeft: '16px', marginTop: '3px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {(act.analysis.keyPoints || []).map((pt, index) => (
                                      <li key={index}>{pt}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <strong>Bubble Filter analysis & Diversification:</strong>
                                  <p style={{ color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.4' }}>
                                    {(act.analysis.sentiment || '').toLowerCase().includes('negative') ? (
                                      <span style={{ color: '#f87171', fontWeight: '500' }}>
                                        ⚠️ Pessimistic Filter Bubble Warning: This content contains negative themes. Continuous consumption of negative material can skew your perspective, harm mental wellbeing, and trap you in a negative bubble.
                                      </span>
                                    ) : ["social media", "entertainment", "forum"].some(c => (act.analysis.contentCategory || '').toLowerCase().includes(c)) ? (
                                      "Warning: bubble contains mostly distraction content. Consider balancing with Wikipedia or educational research sites."
                                    ) : (
                                      "Healthy Bubble: Highly diversified educational and informative session."
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Top Websites List */}
                <div className="panel-card top-sites-card domains-card">
                  <h4>🔝 Top Visited Domains</h4>
                  <div className="top-sites">
                    {topWebsites.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>
                        No domains recorded yet today.
                      </div>
                    ) : (
                      topWebsites.map((w, i) => (
                        <div className="top-site-row" key={i}>
                          <span className="top-site-rank">{i + 1}</span>
                          <div className="top-site-info">
                            <span className="top-site-url">{w.url}</span>
                            <span className="top-site-cat">{w.category}</span>
                          </div>
                          <span className="top-site-time">{w.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="dash-col">
                {/* Historical Analytics Chart */}
                <div className="panel-card analytics-card">
                  <div className="card-header-toggle">
                    <h4>📈 Analytics</h4>
                    <div className="toggle-group">
                      <button className={chartPeriod === 'weekly' ? 'active' : ''} onClick={() => setChartPeriod('weekly')}>Weekly</button>
                      <button className={chartPeriod === 'monthly' ? 'active' : ''} onClick={() => setChartPeriod('monthly')}>Monthly</button>
                    </div>
                  </div>
                  
                  {chartPeriod === 'weekly' ? (
                    <div className="chart-box">
                      <div className="score-label-tag">
                        Weekly Data (Click bars to inspect details)
                      </div>
                      <div className="score-mini-chart">
                        {weeklyList.map((d, i) => (
                          <div className={`mini-bar ${weeklyIndex === i ? 'active' : ''}`}
                            key={i}
                            style={{ height: `${d.score}%` }}
                            onClick={() => setWeeklyIndex(i)}
                            title={`Click to view data for ${d.day}`}
                          />
                        ))}
                      </div>
                      <div className="mini-labels">
                        {weeklyList.map((d, i) => (
                          <span key={i} className={weeklyIndex === i ? 'active' : ''}>
                            {d.day.charAt(0)}
                          </span>
                        ))}
                      </div>
                      
                      {/* Selected Day Data Detail Card */}
                      <div className="chart-detail-box">
                        <span className="detail-date">{selectedWeekly.day} Details</span>
                        <div className="detail-row-grid">
                          <div className="detail-col-item">
                            <span className="detail-lbl">Diet Score</span>
                            <span className="detail-val" style={{ color: scoreColor(selectedWeekly.score) }}>
                              {selectedWeekly.score}/100
                            </span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Focus Time</span>
                            <span className="detail-val">{selectedWeekly.focus}</span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Distracted</span>
                            <span className="detail-val">{selectedWeekly.distracted}</span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Top Domain</span>
                            <span className="detail-val detail-site">{selectedWeekly.topSite}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="chart-box">
                      <div className="score-label-tag">
                        Monthly Data (Click bars to inspect details)
                      </div>
                      <div className="score-mini-chart">
                        {monthlyList.map((d, i) => (
                          <div className={`mini-bar ${monthlyIndex === i ? 'active' : ''}`}
                            key={i}
                            style={{ height: `${d.score}%` }}
                            onClick={() => setMonthlyIndex(i)}
                            title={`Click to view data for ${d.day}`}
                          />
                        ))}
                      </div>
                      <div className="mini-labels">
                        {monthlyList.map((d, i) => (
                          <span key={i} className={monthlyIndex === i ? 'active' : ''}>
                            {d.day.replace("Week ", "W")}
                          </span>
                        ))}
                      </div>
                      
                      {/* Selected Week Data Detail Card */}
                      <div className="chart-detail-box">
                        <span className="detail-date">{selectedMonthly.day} Details</span>
                        <div className="detail-row-grid">
                          <div className="detail-col-item">
                            <span className="detail-lbl">Diet Score</span>
                            <span className="detail-val" style={{ color: scoreColor(selectedMonthly.score) }}>
                              {selectedMonthly.score}/100
                            </span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Focus Time</span>
                            <span className="detail-val">{selectedMonthly.focus}</span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Distracted</span>
                            <span className="detail-val">{selectedMonthly.distracted}</span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Top Domain</span>
                            <span className="detail-val detail-site">{selectedMonthly.topSite}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="panel-card suggestions-card">
                  <h4>💡 Content Suggestions</h4>
                  <div className="suggest-list">
                    {suggestions.map((s, i) => (
                      <div className="suggest-item" key={i}>
                        <span className="suggest-dot" />
                        <p className="suggest-text">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements Log */}
                <div className="panel-card improvements-card">
                  <h4>🔄 Improvements Log</h4>
                  <div className="improve-list">
                    {improvements.map((m, i) => (
                      <div className="improve-item" key={i}>
                        <span className="improve-date">{m.date}</span>
                        <span className="improve-text">{m.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
