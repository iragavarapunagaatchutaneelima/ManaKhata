'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Download, FileText, CalendarDays } from 'lucide-react'
import { formatCurrency } from '@/hooks/useUtils'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface StatementDownloaderProps {
  className?: string
}

export default function StatementDownloader({ className = '' }: StatementDownloaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuthStore()

  const generatePDF = async (type: 'monthly' | 'weekly', scope: 'individual' | 'household') => {
    setIsGenerating(true)
    try {
      // In a real scenario, we'd fetch specific expenses based on type/scope from the backend.
      // For this demo, we'll fetch household dashboard data as a proxy to show something nice.
      const res = await api.getHouseholdAnalytics()
      if (!res.success) throw new Error('Failed to fetch data')
      
      const data = res.data

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const dateStr = new Date().toLocaleDateString()

      // Header
      doc.setFontSize(22)
      doc.setTextColor(79, 70, 229) // Indigo-600
      doc.text('ManaKhata', 14, 20)
      
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Financial Statement`, 14, 28)

      // Details
      doc.setFontSize(10)
      doc.text(`Scope: ${scope === 'household' ? 'Household Overview' : 'Individual (' + user?.fullName + ')'}`, 14, 40)
      doc.text(`Period: ${type === 'monthly' ? 'This Month' : 'This Week'}`, 14, 46)
      doc.text(`Generated: ${dateStr}`, 14, 52)

      // Stats Box
      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(14, 60, pageWidth - 28, 25, 3, 3, 'FD')

      doc.setFontSize(11)
      doc.setTextColor(30, 41, 59)
      
      const totalIncome = formatCurrency(data.totalMonthlyIncome)
      const totalSpent = formatCurrency(data.currentMonthTotal)
      const netSavings = formatCurrency(data.netSavings)

      doc.text(`Total Income: ${totalIncome}`, 20, 70)
      doc.text(`Total Spent: ${totalSpent}`, 90, 70)
      doc.text(`Net Savings: ${netSavings}`, 150, 70)

      // Member Spending Table
      let startY = 95
      if (scope === 'household') {
        doc.setFontSize(14)
        doc.setTextColor(15, 23, 42)
        doc.text('Member Spending Overview', 14, startY)
        
        const tableData = data.memberSpending.map((m: any) => [
          m.name,
          m.role,
          formatCurrency(m.spent),
          formatCurrency(m.walletBalance)
        ])

        ;(doc as any).autoTable({
          startY: startY + 5,
          head: [['Member', 'Role', 'Spent', 'Wallet Balance']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [99, 102, 241] }, // Indigo
          styles: { fontSize: 10 },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        })
        startY = (doc as any).lastAutoTable.finalY + 15
      }

      // Category Breakdown
      doc.setFontSize(14)
      doc.setTextColor(15, 23, 42)
      doc.text('Category Breakdown', 14, startY)

      const categoryData = data.categoryBreakdown.map((c: any) => [
        c.category,
        formatCurrency(c.amount)
      ])

      ;(doc as any).autoTable({
        startY: startY + 5,
        head: [['Category', 'Amount']],
        body: categoryData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, // Emerald
        styles: { fontSize: 10 }
      })

      // Footer
      const pageCount = (doc.internal as any).getNumberOfPages()
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${i} of ${pageCount} - ManaKhata Household Account`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      // Save
      const fileName = `ManaKhata_${scope}_${type}_Statement_${dateStr.replace(/\//g, '-')}.pdf`
      doc.save(fileName)
      toast.success('Statement downloaded successfully!')
      setIsOpen(false)

    } catch (err: any) {
      toast.error('Failed to generate statement')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost flex items-center gap-2 border-white/10 hover:bg-white/5"
      >
        <Download size={16} className="text-brand-400" />
        <span className="text-sm font-medium">Statements</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 glass-card p-3 z-50 shadow-xl border border-white/10">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 px-2">Download PDF</div>
          
          <div className="space-y-1">
            <button 
              onClick={() => generatePDF('monthly', 'household')}
              disabled={isGenerating}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <CalendarDays size={16} className="text-indigo-400" />
              <div>
                <div className="text-sm font-medium text-white">Monthly Report</div>
                <div className="text-[10px] text-white/40">Whole Household</div>
              </div>
            </button>

            <button 
              onClick={() => generatePDF('weekly', 'household')}
              disabled={isGenerating}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <FileText size={16} className="text-emerald-400" />
              <div>
                <div className="text-sm font-medium text-white">Weekly Report</div>
                <div className="text-[10px] text-white/40">Whole Household</div>
              </div>
            </button>

            <div className="h-px w-full bg-white/5 my-2" />

            <button 
              onClick={() => generatePDF('monthly', 'individual')}
              disabled={isGenerating}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <CalendarDays size={16} className="text-indigo-400" />
              <div>
                <div className="text-sm font-medium text-white">My Monthly Report</div>
                <div className="text-[10px] text-white/40">Personal Expenses Only</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
