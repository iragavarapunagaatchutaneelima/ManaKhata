'use client'

import { useMemo } from 'react'
import { Award, Lock } from 'lucide-react'
import { Card, PageHeader, Progress } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { achievements } from '@/lib/finance'
import { today } from '@/lib/money'

export default function AchievementsPage() {
  const { data, userId } = useHousehold()
  const list = useMemo(() => (data ? achievements(data, userId, today()) : []), [data, userId])
  const earned = list.filter((a) => a.earned).length

  return (
    <div>
      <PageHeader title="Achievements" subtitle={`${earned} of ${list.length} earned. Badges reward the money habits that matter.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <Card key={a.id} className="p-5" fold={a.earned}>
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${a.earned ? 'bg-saffron-soft text-saffron-ink' : 'bg-surface-3 text-ink-3'}`}>
                {a.earned ? <Award size={22} /> : <Lock size={18} />}
              </span>
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-[13px] text-ink-3">{a.description}</div>
              </div>
            </div>
            <Progress className="mt-4" value={a.progress} tone={a.earned ? 'saffron' : 'primary'} />
            <div className="mt-1.5 text-right text-[12px] text-ink-3">{a.earned ? 'Earned' : `${Math.round(a.progress)}%`}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
