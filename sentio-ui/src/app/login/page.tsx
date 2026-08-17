'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Code, Mail, Lock } from 'lucide-react';
import { useSpiralAnimation } from '@/hooks/use-spiral-animation';

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  useSpiralAnimation(canvasRef, leftPanelRef);

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex overflow-hidden">
      {/* Left Side - Brand Showcase */}
      <div ref={leftPanelRef} className="left-panel hidden lg:flex flex-1 relative flex-col justify-between p-12 border-r border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-[#070B14] to-[#101826] z-0"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 z-0"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse z-0"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000 z-0"></div>

        {/* Spiral Animation Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: '50%',
            left: '52%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '700px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Vignette is applied via .left-panel::after in CSS */}

        <div className="relative z-10 flex items-center gap-2" style={{ zIndex: 2 }}>
          <Activity className="w-8 h-8 text-blue-500" />
          <span className="text-2xl font-bold tracking-tight">Sentio</span>
        </div>

        <div className="relative z-10 max-w-lg" style={{ zIndex: 2 }}>
          <h2 className="text-4xl font-bold mb-6">Gain an edge with real-time market sentiment.</h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Access institutional-grade analytics, stream thousands of financial events per second, and make data-driven decisions powered by advanced NLP.
          </p>
          <div className="bg-white/[0.04] backdrop-blur-md p-6 rounded-2xl border border-white/10 inline-block">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-slate-400">System Status</div>
                <div className="font-semibold text-green-400">All Systems Operational</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">Processing ~5,240 events/sec via Kafka</div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500" style={{ zIndex: 2 }}>
          © {new Date().getFullYear()} Sentio. Enterprise Security Applied.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative z-10 bg-[#070B14]">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors lg:hidden">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors hidden lg:flex">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6 lg:hidden">
              <Activity className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-slate-400">Sign in to your Sentio dashboard</p>
          </div>

          <div className="bg-[#101826]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <form className="space-y-5 relative z-10" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="email" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Password</label>
                  <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="password" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Link href="/dashboard" className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-center font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] mt-6">
                Sign In
              </Link>
            </form>

            <div className="mt-8 relative z-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[#101826] text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
              <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 transition-colors text-sm font-medium">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 transition-colors text-sm font-medium">
                <Code className="w-5 h-5" />
                GitHub
              </button>
            </div>
          </div>
          
          <p className="text-center mt-8 text-sm text-slate-500">
            Don&apos;t have an account? <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Request Access</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
