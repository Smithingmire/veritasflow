import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Brain, 
  ArrowRight, 
  EyeOff, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { GlowCard } from '../components/GlowCard';
import { AuthModal, SuccessModal, ExtensionModal, PrivacyModal, TermsModal } from '../components/Modal';


export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* ── Modal state ─────────────────────────────────────────── */
  const [authOpen, setAuthOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successType, setSuccessType] = useState<'login' | 'register'>('login');
  const [extOpen, setExtOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/activity/feedback/list")
      .then(res => res.json())
      .then(data => {
        if (data && data.feedbacks) {
          setFeedbacks(data.feedbacks);
        }
      })
      .catch(err => console.error("Error fetching feedbacks:", err));

    fetch("http://localhost:5000/api/activity/auth/users/count")
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setUserCount(data.count);
        }
      })
      .catch(err => console.error("Error fetching user count:", err));
  }, []);

  useEffect(() => {
    const isAuthPath = window.location.pathname === '/auth';
    const mode = searchParams.get('mode');
    if (isAuthPath || searchParams.has('auth')) {
      setAuthOpen(true);
      setAuthTab(mode === 'signup' ? 'register' : 'login');
    }
  }, [searchParams]);

  const openAuth = () => setAuthOpen(true);

  const handleAuthClose = () => {
    setAuthOpen(false);
    if (window.location.pathname === '/auth') {
      navigate('/', { replace: true });
    }
  };

  const handleAuthSuccess = (type: 'login' | 'register') => {
    setAuthOpen(false);
    setSuccessType(type);
    setSuccessOpen(true);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ══════════════════════════════════════════════════════════════
           NAVBAR
      ══════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl glass-panel rounded-full px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-white/20 via-sky-200/20 to-violet-200/20 p-[1px] flex items-center justify-center shadow-glow-blue animate-pulse-slow">
            <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-brand-cyan" />
            </div>
          </div>
          <span className="font-heading text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            VeritasFlow
          </span>
        </div>

        <button 
          onClick={openAuth}
          className="px-4 py-1.5 bg-white hover:bg-white/90 text-[#0c0c0e] rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
        >
          Login / Register <ChevronRight className="w-3 h-3 text-[#0c0c0e]" />
        </button>
      </header>

      {/* ══════════════════════════════════════════════════════════════
           HERO SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[70vh] w-full flex flex-col items-center justify-center px-6 pt-24 pb-10">
        <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]"
          >
            <span className="text-white block">VeritasFlow</span>
            <span className="text-gradient block mt-1">
              Take Control Of Your Information Diet
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-text-secondary text-sm md:text-base max-w-xl leading-relaxed"
          >
            Replace mindless scrolling with intentional learning.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col items-center gap-3 w-full justify-center"
          >
            <button 
              onClick={() => { setAuthTab('register'); setAuthOpen(true); }}
              className="px-7 py-3 bg-white hover:bg-white/90 text-[#0c0c0e] rounded-full font-bold shadow-glass-glow active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4 text-[#0c0c0e]" />
            </button>
            {userCount !== null && (
              <div className="text-xs text-text-secondary mt-3 flex items-center justify-center gap-1.5 opacity-80">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Trusted by <span className="font-semibold text-white">{userCount}</span> users</span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
           THE CHALLENGE
      ═══════════════════════════════════════════════════════════════ */}
      <section id="challenge" className="w-full max-w-6xl px-6 py-12 flex flex-col items-center text-center space-y-8">
        <div className="space-y-2.5">
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-white">
            The Cost Of Unmonitored Feeds
          </h2>
          <p className="text-text-secondary text-sm max-w-2xl">
            Algorithmic loops capitalize on our base impulses. VeritasFlow protects your cognitive domain by letting you approve exactly what enters your diet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {/* Card 1 */}
          <GlowCard 
            className="flex flex-col space-y-3 border border-white/5 bg-white/[0.01]" 
            glowColor="rgba(0, 240, 255, 0.1)"
            delay={0.1}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
              <EyeOff className="w-5 h-5 text-brand-blue" />
            </div>
            <h3 className="font-heading text-lg font-bold text-white">1. Infinite Feeds</h3>
            <p className="text-text-secondary text-xs leading-relaxed">
              Endless streams of content steal attention and reduce intentional learning. Breaking active concentration cycles.
            </p>
          </GlowCard>

          {/* Card 2 */}
          <GlowCard 
            className="flex flex-col space-y-3 border border-white/5 bg-white/[0.01]" 
            glowColor="rgba(191, 0, 255, 0.1)"
            delay={0.2}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center border border-brand-purple/20">
              <Brain className="w-5 h-5 text-brand-purple" />
            </div>
            <h3 className="font-heading text-lg font-bold text-white">2. Cognitive Decline</h3>
            <p className="text-text-secondary text-xs leading-relaxed">
              Information overload damages focus, retention, and critical thinking. Shrinking deep-thought window states.
            </p>
          </GlowCard>

          {/* Card 3 */}
          <GlowCard 
            className="flex flex-col space-y-3 border border-white/5 bg-white/[0.01]" 
            glowColor="rgba(0, 255, 183, 0.1)"
            delay={0.3}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
              <Layers className="w-5 h-5 text-brand-cyan" />
            </div>
            <h3 className="font-heading text-lg font-bold text-white">3. Information Chaos</h3>
            <p className="text-text-secondary text-xs leading-relaxed">
              Without structure, valuable knowledge becomes lost among distractions. Missing links connecting primary resources.
            </p>
          </GlowCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
           METHODOLOGY
      ═══════════════════════════════════════════════════════════════ */}
      <section id="methodology" className="w-full max-w-5xl px-6 py-12 flex flex-col items-center space-y-8">
        <div className="text-center space-y-2.5">
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-white">
            A Conscious Approach To Browsing
          </h2>
          <p className="text-text-secondary text-sm max-w-xl mx-auto">
            Take absolute control of your information habits using a simple, closed-loop conscious flow.
          </p>
        </div>

        <div className="relative w-full flex flex-col md:flex-row justify-between items-stretch gap-5">
          
          {/* Vertical/Horizontal liquid connecting line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] pipeline-gradient-line opacity-20 -translate-y-1/2 hidden md:block z-0" />
          <div className="absolute top-0 bottom-0 left-6 w-[2px] pipeline-gradient-line opacity-20 md:hidden z-0" />

          {/* Step 1 */}
          <div className="relative z-10 flex-1 flex flex-col md:items-center text-left md:text-center space-y-3 pl-12 md:pl-0">
            <div className="w-10 h-10 rounded-full bg-sky-300/20 flex items-center justify-center shadow-glow-blue text-white font-extrabold font-heading text-base self-start md:self-auto">
              1
            </div>
            <GlowCard className="w-full border border-brand-blue/10 bg-white/[0.01] flex flex-col space-y-1.5 p-5">
              <h3 className="font-heading text-base font-bold text-white">Define Your Diet</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Select approved domains, websites, and content categories. Tell VeritasFlow what is intentional.
              </p>
            </GlowCard>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex-1 flex flex-col md:items-center text-left md:text-center space-y-3 pl-12 md:pl-0">
            <div className="w-10 h-10 rounded-full bg-violet-300/20 flex items-center justify-center shadow-glow-purple text-white font-extrabold font-heading text-base self-start md:self-auto">
              2
            </div>
            <GlowCard className="w-full border border-brand-purple/10 bg-white/[0.01] flex flex-col space-y-1.5 p-5">
              <h3 className="font-heading text-base font-bold text-white">Monitor In Real Time</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Track intentional content consumption automatically through our clean background extension.
              </p>
            </GlowCard>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex-1 flex flex-col md:items-center text-left md:text-center space-y-3 pl-12 md:pl-0">
            <div className="w-10 h-10 rounded-full bg-teal-300/20 flex items-center justify-center shadow-glow-cyan text-white font-extrabold font-heading text-base self-start md:self-auto">
              3
            </div>
            <GlowCard className="w-full border border-brand-cyan/10 bg-white/[0.01] flex flex-col space-y-1.5 p-5">
              <h3 className="font-heading text-base font-bold text-white">Reflect &amp; Calibrate</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Review automated insights, check metrics, and continuously calibrate your browsing parameters.
              </p>
            </GlowCard>
          </div>

        </div>
      </section>



      {/* ══════════════════════════════════════════════════════════════
           TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="w-full max-w-5xl px-6 py-12 flex flex-col items-center space-y-8">
        <div className="text-center space-y-2.5">
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-white">
            Loved By Deep Thinkers
          </h2>
          <p className="text-text-secondary text-sm max-w-xl mx-auto">
            See how intentional readers are using VeritasFlow to reclaim their cognitive sovereignty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {(feedbacks.length > 0 ? feedbacks.slice(0, 6) : [
            {
              username: "Dr. Avery R.",
              feedbackText: "VeritasFlow completely altered how I approach content consumption. I used to fall into endless feeds. Now I track only what matters, and my reading depth score has improved by 40%."
            },
            {
              username: "Marcus L.",
              feedbackText: "The local parsing architecture is the selling point for me. I can analyze my sources without worrying that my logs are being sent to some advertising cloud. Next-generation privacy."
            },
            {
              username: "Sarah K.",
              feedbackText: "I love the weekly reports and the visual category graphs. It acts like a fitness tracker for my mind, steering me away from outrage sites towards journals and books."
            }
          ]).map((fb, idx) => (
            <GlowCard key={idx} className="border border-white/5 bg-white/[0.01] flex flex-col justify-between space-y-4">
              <p className="text-text-secondary text-xs italic leading-relaxed">
                "{fb.feedbackText}"
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-200/30 to-violet-400/20 flex items-center justify-center font-bold font-heading text-[11px] text-white">
                  {fb.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{fb.username}</div>
                  <div className="text-[10px] text-brand-cyan font-medium">VeritasFlow User</div>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>



      {/* ══════════════════════════════════════════════════════════════
           FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="w-full max-w-6xl px-6 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-brand-cyan" />
          <span>© 2026 VeritasFlow (Team Invicta). All rights reserved.</span>
        </div>
        <div className="flex gap-5">
          <button onClick={() => setPrivacyOpen(true)} className="text-text-tertiary hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">Privacy Policy</button>
          <button onClick={() => setTermsOpen(true)} className="text-text-tertiary hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">Terms of Service</button>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════
           MODALS (rendered at end, always present)
      ═══════════════════════════════════════════════════════════════ */}
      <AuthModal
        isOpen={authOpen}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
        initialTab={authTab}
      />
      <SuccessModal
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          navigate('/dashboard');
        }}
        type={successType}
      />
      <ExtensionModal
        isOpen={extOpen}
        onClose={() => setExtOpen(false)}
      />
      <PrivacyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
