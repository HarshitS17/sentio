'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Zap, Shield, Database, BarChart3, Globe, Code } from 'lucide-react';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative bg-transparent">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#070B14] to-[#070B14]"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo Graphic */}
            <div className="relative w-10 h-8 flex items-center shrink-0">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white -translate-y-1/2" />
              <div className="absolute bottom-1/2 left-[2px] w-[6px] h-5 bg-white" />
              <div className="absolute bottom-1/2 left-[12px] w-[6px] h-3 bg-white" />
              <div className="absolute top-1/2 left-[22px] w-[6px] h-3 bg-white" />
              <div className="absolute top-1/2 left-[32px] w-[6px] h-5 bg-white" />
            </div>
            
            <div className="flex flex-col pt-1">
              <span className="text-white text-3xl tracking-wide" style={{ fontFamily: 'var(--font-pacifico), cursive' }}>
                Sentio
              </span>
              <span className="text-white/70 text-[0.45rem] tracking-[0.2em] font-bold mt-[-4px] uppercase">
                Turning headlines into insights
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="#features" className="text-slate-400 hover:text-white transition-colors">Features</Link>
            <Link href="#architecture" className="text-slate-400 hover:text-white transition-colors">Architecture</Link>
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full transition-all flex items-center gap-2">
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-32 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
              Real-Time Stock <br /> Sentiment Intelligence
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Analyze millions of news articles and social media posts in milliseconds. Make data-driven trading decisions with AI-powered sentiment analysis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/dashboard" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-medium transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]">
                Launch Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-medium bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all flex items-center justify-center">
                Sign In to Platform
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Infrastructure</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Built for high-frequency data processing and real-time analytics with cutting-edge open source technologies.</p>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Zap, title: "Kafka Pipeline", desc: "High-throughput message streaming processing thousands of financial events per second." },
              { icon: Activity, title: "VADER Sentiment", desc: "Advanced NLP specifically tuned for financial lexicons and market terminology." },
              { icon: Database, title: "Redis Caching", desc: "Ultra-low latency data serving with advanced pub/sub real-time updates." },
              { icon: BarChart3, title: "Live Analytics", desc: "Interactive charts and visualizations powered by React 19 and Recharts." },
              { icon: Globe, title: "Global Sources", desc: "Aggregating news from 50+ financial publications and social platforms." },
              { icon: Shield, title: "Enterprise Security", desc: "End-to-end encryption, rate limiting, and secure authentication flows." }
            ].map((feature, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-white/[0.04] p-8 rounded-2xl hover:bg-white/[0.08] transition-colors border border-white/10 backdrop-blur-md">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 text-blue-400">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="container mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Data Pipeline Architecture</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">How raw market data becomes actionable intelligence in milliseconds.</p>
          </div>
          
          <div className="bg-white/[0.04] backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 overflow-hidden relative">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
              {/* Nodes */}
              <div className="flex flex-col items-center gap-4 w-full lg:w-48">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-xl">
                  <Globe className="w-10 h-10 text-slate-300" />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-lg">Data Sources</h4>
                  <p className="text-xs text-slate-400">RSS / APIs</p>
                </div>
              </div>
              
              <div className="hidden lg:block w-full h-[2px] bg-gradient-to-r from-slate-700 to-blue-500/50"></div>
              
              <div className="flex flex-col items-center gap-4 w-full lg:w-48">
                <div className="w-20 h-20 bg-blue-900/40 rounded-2xl flex items-center justify-center border border-blue-700/50 shadow-xl">
                  <Zap className="w-10 h-10 text-blue-400" />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-lg">Kafka</h4>
                  <p className="text-xs text-slate-400">Stream Processing</p>
                </div>
              </div>

              <div className="hidden lg:block w-full h-[2px] bg-gradient-to-r from-blue-500/50 to-indigo-500/50"></div>

              <div className="flex flex-col items-center gap-4 w-full lg:w-48">
                <div className="w-20 h-20 bg-indigo-900/40 rounded-2xl flex items-center justify-center border border-indigo-700/50 shadow-xl">
                  <Activity className="w-10 h-10 text-indigo-400" />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-lg">VADER</h4>
                  <p className="text-xs text-slate-400">Sentiment AI</p>
                </div>
              </div>

              <div className="hidden lg:block w-full h-[2px] bg-gradient-to-r from-indigo-500/50 to-emerald-500/50"></div>

              <div className="flex flex-col items-center gap-4 w-full lg:w-48">
                <div className="w-20 h-20 bg-emerald-900/40 rounded-2xl flex items-center justify-center border border-emerald-700/50 shadow-xl">
                  <Database className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-lg">Redis</h4>
                  <p className="text-xs text-slate-400">Real-time Cache</p>
                </div>
              </div>

              <div className="hidden lg:block w-full h-[2px] bg-gradient-to-r from-emerald-500/50 to-blue-500/50"></div>

              <div className="flex flex-col items-center gap-4 w-full lg:w-48">
                <div className="w-20 h-20 bg-slate-900/50 rounded-2xl flex items-center justify-center border border-blue-500/50 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
                  <BarChart3 className="w-10 h-10 text-blue-500" />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-lg">Dashboard</h4>
                  <p className="text-xs text-slate-400">Next.js UI</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-24">
          <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              {/* Logo Graphic */}
              <div className="relative w-8 h-6 flex items-center shrink-0 transform scale-75 origin-left">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white -translate-y-1/2" />
                <div className="absolute bottom-1/2 left-[2px] w-[6px] h-5 bg-white" />
                <div className="absolute bottom-1/2 left-[12px] w-[6px] h-3 bg-white" />
                <div className="absolute top-1/2 left-[22px] w-[6px] h-3 bg-white" />
                <div className="absolute top-1/2 left-[32px] w-[6px] h-5 bg-white" />
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-white text-xl tracking-wide leading-none" style={{ fontFamily: 'var(--font-pacifico), cursive' }}>
                  Sentio
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Sentio Financial Intelligence. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <Code className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
