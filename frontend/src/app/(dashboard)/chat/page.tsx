'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, Send, Trash2 } from 'lucide-react'
import { Avatar, Badge, Card, IconButton, cx } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { relativeDay } from '@/lib/money'
import { ROLE_LABELS } from '@/lib/categories'
import type { ChatChannel } from '@/lib/model'

const CHANNELS: { id: ChatChannel; label: string; hint: string }[] = [
  { id: 'general', label: 'general', hint: 'Everyday family chat' },
  { id: 'expenses', label: 'expenses', hint: 'Money questions and receipts' },
  { id: 'plans', label: 'plans', hint: 'Trips, goals and big purchases' },
]

export default function ChatPage() {
  const { data, userId, member, mode, mutate } = useHousehold()
  const [channel, setChannel] = useState<ChatChannel>('general')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  const messages = useMemo(() => {
    const list = (data?.chat ?? []).filter((m) => m.channel === channel).sort((a, b) => a.created_at.localeCompare(b.created_at))
    return list.map((m, i) => ({ m, showDay: i === 0 || list[i - 1].created_at.slice(0, 10) !== m.created_at.slice(0, 10) }))
  }, [data, channel])
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [messages.length, channel])

  async function send() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    const ok = await mutate((b) => b.insert('chat', { channel, content }))
    setSending(false)
    if (ok) setText('')
  }

  return (
    <div className="grid h-[calc(100dvh-170px)] min-h-[460px] gap-4 lg:h-[calc(100dvh-120px)] lg:grid-cols-[220px_1fr]">
      <Card className="hidden flex-col p-3 lg:flex">
        <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-ink-3">Channels</div>
        {CHANNELS.map((c) => (
          <button key={c.id} onClick={() => setChannel(c.id)}
            className={cx('flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm font-medium', channel === c.id ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-surface-2')}>
            <Hash size={15} /> {c.label}
          </button>
        ))}
        <p className="mt-auto px-2 text-[12px] text-ink-3">{mode === 'demo' ? 'Demo chat stays in this browser.' : 'Only members of your household can read these messages.'}</p>
      </Card>

      <Card className="flex min-h-0 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <div className="flex gap-1 lg:hidden">
            {CHANNELS.map((c) => (
              <button key={c.id} onClick={() => setChannel(c.id)} className={cx('rounded-full px-3 py-1 text-[13px] font-semibold', channel === c.id ? 'bg-primary text-on-primary' : 'bg-surface-2 text-ink-2')}>#{c.label}</button>
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="font-semibold">#{channel}</div>
            <div className="text-[12px] text-ink-3">{CHANNELS.find((c) => c.id === channel)?.hint}</div>
          </div>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && <p className="py-10 text-center text-sm text-ink-3">No messages in #{channel} yet. Say hello 👋</p>}
          {messages.map(({ m, showDay }) => {
            const day = m.created_at.slice(0, 10)
            const mine = m.sender_id === userId
            const sender = member(m.sender_id)
            return (
              <div key={m.id}>
                {showDay && <div className="my-3 text-center text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">{relativeDay(day)}</div>}
                <div className={cx('group flex items-end gap-2', mine && 'flex-row-reverse')}>
                  {!mine && <Avatar name={sender?.full_name ?? 'Former member'} size={28} />}
                  <div className={cx('max-w-[78%] rounded-[16px] px-3.5 py-2', mine ? 'rounded-br-[6px] bg-primary text-on-primary' : 'rounded-bl-[6px] bg-surface-2 text-ink')}>
                    {!mine && (
                      <div className="mb-0.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
                        {sender?.full_name.split(' ')[0] ?? 'Former member'}
                        {sender && <Badge className="px-1.5 py-0 text-[10px]">{ROLE_LABELS[sender.role]}</Badge>}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">{m.content}</p>
                    <div className={cx('mt-0.5 text-right text-[10.5px]', mine ? 'text-on-primary/70' : 'text-ink-3')}>
                      {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  {mine && (
                    <IconButton label="Delete message" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => mutate((b) => b.remove('chat', m.id))}><Trash2 size={13} /></IconButton>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottom} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-end gap-2 border-t border-line p-3">
          <textarea className="field max-h-32 min-h-[44px] flex-1 resize-none py-2.5" rows={1} placeholder={`Message #${channel}`} maxLength={2000} value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
          <button type="submit" aria-label="Send" disabled={!text.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary text-on-primary disabled:opacity-50"><Send size={18} /></button>
        </form>
      </Card>
    </div>
  )
}
