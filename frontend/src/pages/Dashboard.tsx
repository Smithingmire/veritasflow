import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Compass, ShieldCheck, ShieldAlert } from 'lucide-react'
import { authService } from '../services/auth'
import './Dashboard.css'
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://veritasflow-yrbx.onrender.com";

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  

  const [accessWebsites, setAccessWebsites] = useState(['youtube.com', 'reddit.com', 'twitter.com', 'medium.com', 'wikipedia.org'])
  const [newSite, setNewSite] = useState('')
  const [focusBlocked, setFocusBlocked] = useState(['instagram.com', 'tiktok.com'])
  const [newBlock, setNewBlock] = useState('')
  const [focusMode, setFocusMode] = useState(false)
  

  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSuccess, setFeedbackSuccess] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  

  const [chartPeriod, setChartPeriod] = useState('weekly')
  const [weeklyIndex, setWeeklyIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  })
  const [monthlyIndex, setMonthlyIndex] = useState(3) // Default to Week 4
  const [yearlyIndex, setYearlyIndex] = useState(11) // Default to current month (last in array)


  const [expandedActivityId, setExpandedActivityId] = useState(null)


  const [dashboardData, setDashboardData] = useState({
    today: { score: 0, label: 'No Data Yet', breakdown: [] },
    topWebsites: [],
    suggestions: [],
    improvements: [],
    weeklyData: [],
    monthlyData: [],
    yearlyData: [],
    weekActivitiesMap: {},
    activities: []
  })
  const [loading, setLoading] = useState(true)


  const fetchDashboardData = async () => {
    try {
      const token = authService.getToken()
      const res = await fetch(`${API_BASE}/api/activity/dashboard`, {
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


  const fetchSettings = async () => {
    try {
      const token = authService.getToken()
      const res = await fetch(`${API_BASE}/api/activity/settings`, {
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


    const interval = setInterval(fetchDashboardData, 5000)
    return () => clearInterval(interval)
  }, [navigate])


  const saveSettings = async (newTracked, newBlocked, newFocusVal) => {
    try {
      const token = authService.getToken()
      await fetch(`${API_BASE}/api/activity/settings`, {
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
      const res = await fetch(`${API_BASE}/api/activity/feedback`, {
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


  const todayScore = dashboardData.today?.score ?? 0
  const todayLabel = dashboardData.today?.label || 'No Data Yet'
  const todayBreakdown = dashboardData.today?.breakdown || []
  const topWebsites = dashboardData.topWebsites || []
  const suggestions = dashboardData.suggestions || []
  const improvements = dashboardData.improvements || []
  const weeklyList = dashboardData.weeklyData || []
  const monthlyList = dashboardData.monthlyData || []
  const weekActivitiesMap = dashboardData.weekActivitiesMap || {}
  const yearlyList = dashboardData.yearlyData || []
  const todayActivities = dashboardData.activities || []
  const doomScroll = dashboardData.doomScroll || { todayReminders: 0, weekReminders: 0, todayTime: '0s', weekTime: '0s' }


  const selectedWeekly = weeklyList[weeklyIndex] || { day: 'None', dateStr: '', isToday: false, score: 0, focus: '0s', distracted: '0s', topSite: 'None' }
  const selectedMonthly = monthlyList[monthlyIndex] || { day: 'None', dateRange: '', score: 0, avgDietScore: 0, focus: '0s', distracted: '0s', topSite: 'None', totalActivities: 0 }
  const selectedYearly = yearlyList[yearlyIndex] || { day: 'None', fullLabel: '', isCurrentMonth: false, score: 0, avgDietScore: 0, focus: '0s', distracted: '0s', topSite: 'None', totalActivities: 0, totalTime: '0s' }


  const hasWeekMap = Object.keys(weekActivitiesMap).length > 0
  const selectedDayActivities = (() => {
    // If we have the week activities map from backend, use it
    if (hasWeekMap && selectedWeekly.dateStr) {
      const dayActs = weekActivitiesMap[selectedWeekly.dateStr] || []
      // For today, if weekMap is empty but we have todayActivities, use those
      if (dayActs.length === 0 && selectedWeekly.isToday && todayActivities.length > 0) {
        return todayActivities
      }
      return dayActs
    }
    // Fallback: no weekMap (old backend) — show today's activities
    return todayActivities
  })()

  // Helper to format total duration
  const formatTotalTime = (activitiesList) => {
    if (!activitiesList || activitiesList.length === 0) return "0s";
    const totalSecs = activitiesList.reduce((sum, act) => sum + act.duration, 0);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hours = Math.floor(mins / 60);
    const displayMins = mins % 60;
    
    if (hours > 0) {
      return `${hours}h ${displayMins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const todayTotalTime = formatTotalTime(todayActivities);
  const selectedDayTime = formatTotalTime(selectedDayActivities);


  const credibilityStats = (() => {
    let totalNewsCount = 0;
    let lowRiskCount = 0;
    let mediumRiskCount = 0;
    let highRiskCount = 0;

    selectedDayActivities.forEach(act => {
      if (act.analysis) {
        totalNewsCount++;
        const risk = (act.analysis.fakeNewsRisk || 'Low').toLowerCase();
        if (risk === 'high') {
          highRiskCount++;
        } else if (risk === 'medium') {
          mediumRiskCount++;
        } else {
          lowRiskCount++;
        }
      }
    });

    let score = 100;
    if (totalNewsCount > 0) {
      score = Math.round(((lowRiskCount * 100) + (mediumRiskCount * 50) + (highRiskCount * 0)) / totalNewsCount);
    }

    return {
      totalNewsCount,
      lowRiskCount,
      mediumRiskCount,
      highRiskCount,
      score,
      rating: score >= 85 ? 'Highly Reliable' : score >= 60 ? 'Generally Reliable' : 'Caution Advised'
    };
  })();

  const todayWeeklyIndex = weeklyList.findIndex(d => d.isToday)

  return (
    <div className="dash">

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


      <div className="dash-layout">
        

        <aside className="dash-sidebar">

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
                color: 'var(--text-main)', 
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


        <main className="dash-main">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--accent)' }}>
              <h3>Loading Dashboard Data...</h3>
            </div>
          ) : (
            <>
              <div className="dash-col">

                <div className="panel-card metrics-card">
                  <h4>📊 Today's Metrics</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <div className="score-label-tag" style={{ color: scoreColor(todayScore) }}>
                      Today's Score: {todayScore}/100 ({todayLabel})
                    </div>
                    <div className="score-label-tag" style={{ color: 'var(--accent)' }}>
                      ⏱️ Total Time: {todayTotalTime}
                    </div>
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


                <div className="panel-card top-sites-card activity-log-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0 }}>🔍 {selectedWeekly.isToday || !selectedWeekly.dateStr ? "Today's" : `${selectedWeekly.day}'s`} Content Consumption</h4>
                    <span className="score-label-tag" style={{ color: 'var(--accent)', fontSize: '11px', padding: '2px 6px' }}>
                      ⏱️ {selectedDayTime}
                    </span>
                  </div>
                  <p className="sidebar-hint" style={{ marginBottom: '12px' }}>
                    {selectedWeekly.isToday || !selectedWeekly.dateStr
                      ? 'Click "More Details" to see deep AI insights on content consumed today.'
                      : `Showing content consumed on ${selectedWeekly.day} (${selectedWeekly.dateStr}). Click a day in the weekly chart to switch.`
                    }
                  </p>
                  
                  <div className="top-sites" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedDayActivities.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>
                        {selectedWeekly.isToday || !selectedWeekly.dateStr
                          ? 'No content tracked yet today. Start browsing tracked sites to see data!'
                          : `No content was tracked on ${selectedWeekly.day}.`
                        }
                      </div>
                    ) : (
                      selectedDayActivities.map((act) => {
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
                                <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{act.title}</h5>
                                <span style={{ fontSize: '11px', color: 'var(--accent)', marginRight: '10px' }}>{act.domain}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spent: {durationStr}</span>
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


                            {isExpanded && act.analysis && (
                              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {act.channel && (
                                  <div>
                                    <strong>Channel/Creator:</strong> <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{act.channel}</span>
                                  </div>
                                )}
                                <div>
                                  <strong>Sentiment:</strong> <span style={{ color: act.analysis.sentiment === 'Positive' ? '#34d399' : act.analysis.sentiment === 'Negative' ? '#f87171' : 'var(--text-muted)' }}>{act.analysis.sentiment || 'Neutral'}</span>
                                </div>
                                <div>
                                  <strong>Category:</strong> <span>{act.analysis.contentCategory || 'General'}</span>
                                </div>
                                <div>
                                  <strong>Diet Score:</strong> <span style={{ color: scoreColor(act.analysis.learningScore) }}>{act.analysis.learningScore || 50}/100</span>
                                </div>
                                <div>
                                  <strong>Source Credibility:</strong>{' '}
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-block',
                                    marginLeft: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    background: act.analysis.fakeNewsRisk === 'High' ? 'rgba(239, 68, 68, 0.12)' : act.analysis.fakeNewsRisk === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                    color: act.analysis.fakeNewsRisk === 'High' ? '#f87171' : act.analysis.fakeNewsRisk === 'Medium' ? '#fbbf24' : '#34d399',
                                    border: act.analysis.fakeNewsRisk === 'High' ? '1px solid rgba(239, 68, 68, 0.25)' : act.analysis.fakeNewsRisk === 'Medium' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)'
                                  }}>
                                    {(act.analysis.fakeNewsRisk || 'Low').toUpperCase()} RISK
                                  </span>
                                </div>
                                <div>
                                  <strong>AI Summary:</strong> <p style={{ color: 'var(--text-muted)', marginTop: '3px', lineHeight: '1.4' }}>{act.analysis.summary}</p>
                                </div>
                                <div>
                                  <strong>Key Learnings:</strong>
                                  <ul style={{ paddingLeft: '16px', marginTop: '3px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {(act.analysis.keyPoints || []).map((pt, index) => (
                                      <li key={index}>{pt}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <strong>Bubble Filter analysis & Diversification:</strong>
                                  <p style={{ color: 'var(--text-muted)', marginTop: '3px', lineHeight: '1.4' }}>
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


                <div className="panel-card top-sites-card domains-card">
                  <h4>🔝 Top Visited Domains</h4>
                  <div className="top-sites">
                    {topWebsites.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>
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

                <div className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {credibilityStats.score >= 60 ? (
                        <ShieldCheck className="w-4 h-4" style={{ color: '#34d399', width: '16px', height: '16px' }} />
                      ) : (
                        <ShieldAlert className="w-4 h-4" style={{ color: '#f87171', width: '16px', height: '16px' }} />
                      )}
                      📰 News Transparency & Credibility
                    </h4>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: credibilityStats.score >= 85 ? 'rgba(16, 185, 129, 0.12)' : credibilityStats.score >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: credibilityStats.score >= 85 ? '#34d399' : credibilityStats.score >= 60 ? '#fbbf24' : '#f87171',
                      border: credibilityStats.score >= 85 ? '1px solid rgba(16, 185, 129, 0.25)' : credibilityStats.score >= 60 ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
                    }}>
                      {credibilityStats.rating}
                    </span>
                  </div>
                  
                  <p className="sidebar-hint" style={{ margin: 0 }}>
                    Real-time reliability rating of sources consumed on {selectedWeekly.day || 'Today'} based on AI analysis of misinformation risk.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
                    <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.03)"
                          strokeWidth="3.5"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={credibilityStats.score >= 85 ? '#10b981' : credibilityStats.score >= 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3.5"
                          strokeDasharray={`${credibilityStats.score}, 100`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 1s ease' }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                          {credibilityStats.score}%
                        </span>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>CREDIBILITY INDEX</span>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                        {credibilityStats.totalNewsCount > 0 ? (
                          <>Based on {credibilityStats.totalNewsCount} analyzed source{credibilityStats.totalNewsCount !== 1 ? 's' : ''}</>
                        ) : (
                          <>No sources analyzed for {selectedWeekly.day || 'Today'}</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '700' }}>LOW RISK</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{credibilityStats.lowRiskCount}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: '700' }}>MED RISK</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{credibilityStats.mediumRiskCount}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: '#f87171', fontWeight: '700' }}>HIGH RISK</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{credibilityStats.highRiskCount}</span>
                    </div>
                  </div>

                  {credibilityStats.totalNewsCount > 0 ? (
                    credibilityStats.highRiskCount > 0 ? (
                      <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                        <p style={{ color: '#fca5a5', fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
                          ⚠️ <strong>Misinformation Alert:</strong> You consumed {credibilityStats.highRiskCount} source{credibilityStats.highRiskCount !== 1 ? 's' : ''} classified as high fake news risk today. Cross-check statements before sharing.
                        </p>
                      </div>
                    ) : credibilityStats.mediumRiskCount > 0 ? (
                      <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
                        <p style={{ color: '#fde047', fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
                          ℹ️ <strong>Moderate Bias Notice:</strong> Some consumed sources contain moderate risk of bias or unverified reports. Read critically and compare with alternative viewpoints.
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                        <p style={{ color: '#34d399', fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
                          ✅ <strong>Verified Stream:</strong> All consumed sources have a low fake news risk score. Your current information stream is highly transparent and reliable.
                        </p>
                      </div>
                    )
                  ) : (
                    <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
                        No tracked web activity recorded for this day yet. News transparency reports will generate once you browse tracked sites.
                      </p>
                    </div>
                  )}
                </div>

                <div className="panel-card" style={{ padding: '16px' }}>
                  <h4>🌀 Doomscrolling Index</h4>
                  <p className="sidebar-hint" style={{ marginBottom: '12px' }}>
                    Reminders triggered when you scroll Shorts/Reels for 5+ minutes continuously.
                  </p>
                  <div className="detail-row-grid">
                    <div className="detail-col-item">
                      <span className="detail-lbl">Today</span>
                      <span className="detail-val" style={{ color: doomScroll.todayReminders > 0 ? '#ef4444' : '#10b981' }}>
                        {doomScroll.todayReminders} reminder{doomScroll.todayReminders !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="detail-col-item">
                      <span className="detail-lbl">This Week</span>
                      <span className="detail-val" style={{ color: doomScroll.weekReminders > 0 ? '#f59e0b' : '#10b981' }}>
                        {doomScroll.weekReminders} reminder{doomScroll.weekReminders !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="detail-col-item">
                      <span className="detail-lbl">Doom Time Today</span>
                      <span className="detail-val" style={{ color: '#ef4444' }}>{doomScroll.todayTime}</span>
                    </div>
                    <div className="detail-col-item">
                      <span className="detail-lbl">Doom Time Week</span>
                      <span className="detail-val" style={{ color: '#f59e0b' }}>{doomScroll.weekTime}</span>
                    </div>
                  </div>
                  {doomScroll.todayReminders === 0 && (
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                      <p style={{ color: '#34d399', fontSize: '12px', margin: 0 }}>✅ No doomscrolling detected today. Keep it up!</p>
                    </div>
                  )}
                  {doomScroll.todayReminders > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                      <p style={{ color: '#fca5a5', fontSize: '12px', margin: 0 }}>⚠️ You were caught doomscrolling {doomScroll.todayReminders} time{doomScroll.todayReminders !== 1 ? 's' : ''} today. Short-form content reduces your attention span over time.</p>
                    </div>
                  )}
                </div>
                <div className="panel-card analytics-card">
                  <div className="card-header-toggle">
                    <h4>📈 Analytics</h4>
                    <div className="toggle-group">
                      <button className={chartPeriod === 'weekly' ? 'active' : ''} onClick={() => setChartPeriod('weekly')}>Weekly</button>
                      <button className={chartPeriod === 'monthly' ? 'active' : ''} onClick={() => setChartPeriod('monthly')}>Monthly</button>
                      <button className={chartPeriod === 'yearly' ? 'active' : ''} onClick={() => setChartPeriod('yearly')}>Yearly</button>
                    </div>
                  </div>
                  
                  {chartPeriod === 'weekly' ? (
                    <div className="chart-box">
                      <div className="score-label-tag">
                        Weekly Data (Click bars to inspect details)
                      </div>
                      <div className="score-mini-chart">
                        {weeklyList.map((d, i) => (
                          <div className={`mini-bar ${weeklyIndex === i ? 'active' : ''} ${d.isToday ? 'today' : ''}`}
                            key={i}
                            style={{ height: `${Math.max(d.score, 5)}%` }}
                            onClick={() => setWeeklyIndex(i)}
                            title={`Click to view data for ${d.day}${d.isToday ? ' (Today)' : ''}`}
                          />
                        ))}
                      </div>
                      <div className="mini-labels">
                        {weeklyList.map((d, i) => (
                          <span key={i} className={`${weeklyIndex === i ? 'active' : ''} ${d.isToday ? 'today-label' : ''}`}>
                            {d.day.charAt(0)}{d.isToday ? '•' : ''}
                          </span>
                        ))}
                      </div>
                      

                      <div className="chart-detail-box">
                        <span className="detail-date">
                          {selectedWeekly.day} {selectedWeekly.isToday ? '(Today)' : ''} — {selectedWeekly.dateStr}
                        </span>
                        <div className="detail-row-grid">
                          <div className="detail-col-item">
                            <span className="detail-lbl">Daily Diet Score</span>
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
                  ) : chartPeriod === 'monthly' ? (
                    <div className="chart-box">
                      <div className="score-label-tag">
                        Monthly Data (Click bars to inspect details)
                      </div>
                      <div className="score-mini-chart">
                        {monthlyList.map((d, i) => (
                          <div className={`mini-bar ${monthlyIndex === i ? 'active' : ''} ${i === monthlyList.length - 1 ? 'today' : ''}`}
                            key={i}
                            style={{ height: `${d.score}%` }}
                            onClick={() => setMonthlyIndex(i)}
                            title={`Click to view data for ${d.day}`}
                          />
                        ))}
                      </div>
                      <div className="mini-labels">
                        {monthlyList.map((d, i) => (
                          <span key={i} className={`${monthlyIndex === i ? 'active' : ''} ${i === monthlyList.length - 1 ? 'today-label' : ''}`}>
                            {d.day.replace("This Week", "Week 4")}
                          </span>
                        ))}
                      </div>
                      

                      <div className="chart-detail-box">
                        <span className="detail-date">{selectedMonthly.day} — {selectedMonthly.dateRange || ''}</span>
                        <div className="detail-row-grid">
                          <div className="detail-col-item">
                            <span className="detail-lbl">Avg Diet Score</span>
                            <span className="detail-val" style={{ color: scoreColor(selectedMonthly.avgDietScore || selectedMonthly.score) }}>
                              {selectedMonthly.avgDietScore || selectedMonthly.score}/100
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
                            <span className="detail-lbl">Activities</span>
                            <span className="detail-val">{selectedMonthly.totalActivities || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="chart-box">
                      <div className="score-label-tag">
                        Yearly Data (Click bars to inspect monthly details)
                      </div>
                      <div className="score-mini-chart">
                        {yearlyList.map((d, i) => (
                          <div className={`mini-bar ${yearlyIndex === i ? 'active' : ''} ${d.isCurrentMonth ? 'today' : ''}`}
                            key={i}
                            style={{ height: `${Math.max(d.score, 5)}%` }}
                            onClick={() => setYearlyIndex(i)}
                            title={`Click to view data for ${d.fullLabel}${d.isCurrentMonth ? ' (Current)' : ''}`}
                          />
                        ))}
                      </div>
                      <div className="mini-labels">
                        {yearlyList.map((d, i) => (
                          <span key={i} className={`${yearlyIndex === i ? 'active' : ''} ${d.isCurrentMonth ? 'today-label' : ''}`}>
                            {d.day}
                          </span>
                        ))}
                      </div>
                      

                      <div className="chart-detail-box">
                        <span className="detail-date">
                          {selectedYearly.fullLabel} {selectedYearly.isCurrentMonth ? '(Current)' : ''}
                        </span>
                        <div className="detail-row-grid">
                          <div className="detail-col-item">
                            <span className="detail-lbl">Avg Diet Score</span>
                            <span className="detail-val" style={{ color: scoreColor(selectedYearly.avgDietScore || selectedYearly.score) }}>
                              {selectedYearly.avgDietScore || selectedYearly.score}/100
                            </span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Focus Time</span>
                            <span className="detail-val">{selectedYearly.focus}</span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Distracted</span>
                            <span className="detail-val">{selectedYearly.distracted}</span>
                          </div>
                          <div className="detail-col-item">
                            <span className="detail-lbl">Activities</span>
                            <span className="detail-val">{selectedYearly.totalActivities || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


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
