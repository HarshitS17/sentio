'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateMockReports } from '@/lib/mock-data';
import { FileText, Download, Calendar, ChevronRight, FileBarChart, Filter } from 'lucide-react';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const reports = generateMockReports();

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-[#94A3B8] mt-1">AI-generated sentiment analysis reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-medium hover:bg-[#2563EB] transition-colors">
          <FileBarChart className="w-4 h-4" /> Generate Report
        </button>
      </header>

      {/* Report Generator Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        <h2 className="font-semibold text-white mb-4">Create New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[#94A3B8] block mb-1.5">Report Type</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 appearance-none">
              <option className="bg-[#101826]">Sector Analysis</option>
              <option className="bg-[#101826]">Weekly Summary</option>
              <option className="bg-[#101826]">Stock Deep Dive</option>
              <option className="bg-[#101826]">Market Mood Report</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#94A3B8] block mb-1.5">Date Range</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 appearance-none">
              <option className="bg-[#101826]">Last 7 days</option>
              <option className="bg-[#101826]">Last 30 days</option>
              <option className="bg-[#101826]">Last 90 days</option>
              <option className="bg-[#101826]">Custom</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#94A3B8] block mb-1.5">Format</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 appearance-none">
              <option className="bg-[#101826]">PDF</option>
              <option className="bg-[#101826]">CSV</option>
              <option className="bg-[#101826]">JSON</option>
            </select>
          </div>
        </div>
        <button className="mt-4 px-6 py-2.5 rounded-xl bg-[#3B82F6] text-white text-sm font-medium hover:bg-[#2563EB] transition-colors">
          Generate
        </button>
      </motion.div>

      {/* Previous Reports */}
      <div>
        <h2 className="font-semibold text-white mb-4">Previous Reports</h2>
        <div className="space-y-3">
          {reports.map((report, idx) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white group-hover:text-[#3B82F6] transition-colors truncate">{report.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[#94A3B8]">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.date).toLocaleDateString()}</span>
                  <span>{report.author}</span>
                  <span>{report.pages} pages</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5">{report.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg bg-white/5 hover:bg-[#3B82F6]/10 transition-colors opacity-0 group-hover:opacity-100">
                  <Download className="w-4 h-4 text-[#94A3B8] hover:text-[#3B82F6]" />
                </button>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
