'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Hash, Users, Sparkles, Smile, Image, Paperclip, MoreVertical, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { DEMO_USERS } from '@/constants/demo'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  channel: string
  senderName: string
  senderEmail: string
  senderRole: string
  content: string
  timestamp: string
}

interface Channel {
  id: string
  name: string
  description: string
  icon: string
}

const channels: Channel[] = [
  { id: 'general', name: 'general', description: 'General household announcements and banter', icon: '📢' },
  { id: 'expenses-discussions', name: 'expenses-discussions', description: 'Discussing budgets, savings, and ledger entries', icon: '💰' },
  { id: 'trip-planning', name: 'trip-planning', description: 'Coordinating itineraries and travel expenses', icon: '✈️' }
]

const initialMessages: ChatMessage[] = [
  // General Channel Messages
  {
    id: 'g1',
    channel: 'general',
    senderName: 'Demo User 1',
    senderEmail: 'DEMO_USERS[0].email',
    senderRole: 'HOUSEHEAD',
    content: 'Welcome everyone to our new ManaKhata space! Let\'s keep this board active to manage our daily logs.',
    timestamp: '10:15 AM'
  },
  {
    id: 'g2',
    channel: 'general',
    senderName: 'Demo User 2',
    senderEmail: 'DEMO_USERS[1].email',
    senderRole: 'PARENT',
    content: 'Perfect! I just logged the milk and vegetable groceries for today. Super easy to use.',
    timestamp: '10:20 AM'
  },
  {
    id: 'g3',
    channel: 'general',
    senderName: 'Demo User 4',
    senderEmail: 'DEMO_USERS[3].email',
    senderRole: 'GRANDPARENT',
    content: 'I also noticed the medicine logs are much clearer now. Good job setting this up.',
    timestamp: '11:05 AM'
  },
  {
    id: 'g4',
    channel: 'general',
    senderName: 'Demo User 3',
    senderEmail: 'DEMO_USERS[2].email',
    senderRole: 'ADULT_CHILD',
    content: 'Awesome. By the way, I might need a pocket money wallet reload soon for college text books.',
    timestamp: '11:15 AM'
  },

  // Expenses Channel Messages
  {
    id: 'e1',
    channel: 'expenses-discussions',
    senderName: 'Demo User 2',
    senderEmail: 'DEMO_USERS[1].email',
    senderRole: 'PARENT',
    content: 'Hey, I see we spent ₹2,450 on monthly groceries. Is that including the weekend store run?',
    timestamp: 'Yesterday, 4:10 PM'
  },
  {
    id: 'e2',
    channel: 'expenses-discussions',
    senderName: 'Demo User 1',
    senderEmail: 'DEMO_USERS[0].email',
    senderRole: 'HOUSEHEAD',
    content: 'Yes, that covers all the groceries. Our grocery budget is currently at 68% utilization. We are safe!',
    timestamp: 'Yesterday, 4:15 PM'
  },
  {
    id: 'e3',
    channel: 'expenses-discussions',
    senderName: 'Demo User 3',
    senderEmail: 'DEMO_USERS[2].email',
    senderRole: 'ADULT_CHILD',
    content: 'I will log my fuel refills under petrol. Can we review the vehicle maintenance budget next weekend?',
    timestamp: 'Yesterday, 5:30 PM'
  },

  // Trip Channel Messages
  {
    id: 't1',
    channel: 'trip-planning',
    senderName: 'Demo User 3',
    senderEmail: 'DEMO_USERS[2].email',
    senderRole: 'ADULT_CHILD',
    content: 'So excited for the Goa trip! I draft-planned the beach itinerary. Day 1: Baga, Day 2: Palolem.',
    timestamp: '2 Days Ago'
  },
  {
    id: 't2',
    channel: 'trip-planning',
    senderName: 'Demo User 2',
    senderEmail: 'DEMO_USERS[1].email',
    senderRole: 'PARENT',
    content: 'Looks good, but let\'s keep the budget under ₹45,000. Flight bookings are priority.',
    timestamp: '2 Days Ago'
  },
  {
    id: 't3',
    channel: 'trip-planning',
    senderName: 'Demo User 4',
    senderEmail: 'DEMO_USERS[3].email',
    senderRole: 'GRANDPARENT',
    content: 'I will handle the medical travel kit and basic packing checklist. Let me know if we need travel insurance.',
    timestamp: '1 Day Ago'
  }
]

// Automated script responses based on channel and user message
const mockMemberReplies: Record<string, { sender: string, email: string, role: string, content: string }[]> = {
  general: [
    { sender: 'Demo User 2', email: 'DEMO_USERS[1].email', role: 'PARENT', content: 'Great point. Let\'s discuss this at dinner tonight.' },
    { sender: 'Demo User 1', email: 'DEMO_USERS[0].email', role: 'HOUSEHEAD', content: 'Understood. I will check the ledger update in a bit.' },
    { sender: 'Demo User 3', email: 'DEMO_USERS[2].email', role: 'ADULT_CHILD', content: 'Got it! I\'m free after my classes today if anyone needs help.' },
    { sender: 'Demo User 4', email: 'DEMO_USERS[3].email', role: 'GRANDPARENT', content: 'I agree. Let\'s maintain this track list.' }
  ],
  'expenses-discussions': [
    { sender: 'Demo User 1', email: 'DEMO_USERS[0].email', role: 'HOUSEHEAD', content: 'I just reviewed the budget logs. Everything looks clean and aligned.' },
    { sender: 'Demo User 2', email: 'DEMO_USERS[1].email', role: 'PARENT', content: 'Let\'s try to keep the variable expenses lower this week to maximize savings.' },
    { sender: 'Demo User 3', email: 'DEMO_USERS[2].email', role: 'ADULT_CHILD', content: 'I\'ll write down the notes for any emergency cash draws.' }
  ],
  'trip-planning': [
    { sender: 'Demo User 3', email: 'DEMO_USERS[2].email', role: 'ADULT_CHILD', content: 'Should we add water sports to the Goa activity budget? I heard Palolem has great kayaking!' },
    { sender: 'Demo User 2', email: 'DEMO_USERS[1].email', role: 'PARENT', content: 'I\'ll verify the budget allocation before we book any extra guided tours.' },
    { sender: 'Demo User 1', email: 'DEMO_USERS[0].email', role: 'HOUSEHEAD', content: 'Trip budget of ₹45k is configured. Let\'s log all hotel bills to it.' }
  ]
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const [activeChannel, setActiveChannel] = useState<string>('general')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load chat messages from LocalStorage or seed default
    const savedMessages = localStorage.getItem('mk_chat_messages')
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    } else {
      setMessages(initialMessages)
      localStorage.setItem('mk_chat_messages', JSON.stringify(initialMessages))
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      channel: activeChannel,
      senderName: user?.fullName || 'Demo User',
      senderEmail: user?.email || 'DEMO_USERS[0].email',
      senderRole: user?.role || 'HOUSEHEAD',
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = [...messages, userMessage]
    setMessages(updated)
    localStorage.setItem('mk_chat_messages', JSON.stringify(updated))
    setInputText('')

    // Trigger simulated response from another family member
    triggerSimulatedReply(activeChannel)
  }

  const triggerSimulatedReply = (channel: string) => {
    // Select a random reply from pool
    const pool = mockMemberReplies[channel] || mockMemberReplies.general
    // Filter out replies from the user themselves
    const availableReplies = pool.filter(r => r.email.toLowerCase() !== user?.email?.toLowerCase())
    if (availableReplies.length === 0) return

    const randomReply = availableReplies[Math.floor(Math.random() * availableReplies.length)]

    // Start typing status
    setTimeout(() => {
      setTypingUser(randomReply.sender)
    }, 1000)

    // Append reply
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        channel,
        senderName: randomReply.sender,
        senderEmail: randomReply.email,
        senderRole: randomReply.role,
        content: randomReply.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => {
        const next = [...prev, replyMessage]
        localStorage.setItem('mk_chat_messages', JSON.stringify(next))
        return next
      })
      setTypingUser(null)
    }, 3200)
  }

  const currentChannel = channels.find(c => c.id === activeChannel) || channels[0]
  const channelMessages = messages.filter(m => m.channel === activeChannel)

  return (
    <div className="max-w-6xl mx-auto h-[600px] flex rounded-2xl border border-white/5 overflow-hidden glass-card">
      {/* Channels Sidebar */}
      <div className="w-64 border-r border-white/5 flex flex-col justify-between" style={{ background: 'var(--bg-secondary)' }}>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-1.5 px-2">
            <Sparkles size={16} className="text-indigo-400" />
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Family Channels</h3>
          </div>

          <div className="space-y-1">
            {channels.map(ch => {
              const isActive = ch.id === activeChannel
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannel(ch.id)
                    setTypingUser(null)
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                    isActive 
                      ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-glow-brand text-indigo-400 font-semibold' 
                      : 'hover:bg-white/4 text-muted-foreground'
                  }`}
                  style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  <span className="text-sm">{ch.icon}</span>
                  <div className="text-xs">
                    <div className="flex items-center gap-0.5">
                      <Hash size={12} className="opacity-65" />
                      {ch.name}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Member list footer card */}
        <div className="p-4 border-t border-white/5 space-y-3" style={{ background: 'var(--bg-primary)' }}>
          <span className="text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Users size={12} /> Active Household ({4} online)
          </span>
          <div className="space-y-2">
            {[
              { name: 'Demo User 1', icon: '👑', status: 'Online' },
              { name: 'Demo User 2', icon: '👩', status: 'Online' },
              { name: 'Demo User 3', icon: '👦', status: 'Online' },
              { name: 'Demo User 4', icon: '👴', status: 'Online' }
            ].map(m => (
              <div key={m.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <span>{m.icon}</span>
                  {m.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message Chat Room */}
      <div className="flex-1 flex flex-col justify-between bg-black/10">
        {/* Channel Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between" style={{ background: 'var(--bg-secondary)' }}>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                #{currentChannel.name}
              </span>
              <span className="text-xs">{currentChannel.icon}</span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {currentChannel.description}
            </p>
          </div>
          <button 
            onClick={() => toast.success('Muted/Notification features are mocked')}
            className="p-1.5 rounded-lg hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[440px]">
          {channelMessages.map(msg => {
            const isSelf = msg.senderEmail.toLowerCase() === user?.email?.toLowerCase()
            const roleBadges: Record<string, string> = {
              HOUSEHEAD: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
              PARENT: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
              ADULT_CHILD: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
              GRANDPARENT: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }

            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs bg-indigo-600/30 border border-indigo-500/20 shrink-0">
                  {msg.senderName.charAt(0)}
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <div className={`flex items-center gap-1.5 text-[10px] ${isSelf ? 'justify-end' : ''}`}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {msg.senderName}
                    </span>
                    <span className={`text-[8px] px-1 py-0.2 rounded font-semibold ${roleBadges[msg.senderRole] || 'bg-gray-500/10 text-gray-400'}`}>
                      {msg.senderRole.replace('_', ' ').toLowerCase()}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                  </div>

                  <div 
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isSelf 
                        ? 'bg-indigo-600/20 border border-indigo-500/30 text-white rounded-tr-none' 
                        : 'bg-white/4 border border-white/5 rounded-tl-none'
                    }`}
                    style={{ color: isSelf ? '#ffffff' : 'var(--text-secondary)' }}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing Indicator */}
          <AnimatePresence>
            {typingUser && (
              <motion.div 
                className="flex gap-3 max-w-[85%]"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs bg-indigo-600/30 border border-indigo-500/20 shrink-0 animate-pulse">
                  {typingUser.charAt(0)}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {typingUser} is typing...
                  </span>
                  <div className="p-3 rounded-2xl bg-white/4 border border-white/5 rounded-tl-none flex gap-1 items-center h-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce delay-100" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce delay-200" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box Form */}
        <form 
          onSubmit={handleSend}
          className="p-4 border-t border-white/5 flex gap-2 items-center"
          style={{ background: 'var(--bg-secondary)' }}
        >
          {/* Mock extra buttons */}
          <button 
            type="button" 
            onClick={() => toast.error('Attachment upload features are mocked')}
            className="p-2 rounded-xl hover:bg-white/5" 
            style={{ color: 'var(--text-muted)' }}
          >
            <Paperclip size={16} />
          </button>
          <button 
            type="button" 
            onClick={() => toast.error('Images uploads are mocked')}
            className="p-2 rounded-xl hover:bg-white/5" 
            style={{ color: 'var(--text-muted)' }}
          >
            <Image size={16} />
          </button>

          <input 
            id="chat-message-input"
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message #${currentChannel.name}...`}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl text-xs py-2 px-3 text-white outline-none focus:border-indigo-500/50 transition-colors"
          />

          <button 
            type="button" 
            onClick={() => toast.error('Emoji panel is mocked')}
            className="p-2 rounded-xl hover:bg-white/5" 
            style={{ color: 'var(--text-muted)' }}
          >
            <Smile size={16} />
          </button>

          <button 
            id="chat-send-btn"
            type="submit" 
            className="btn-primary p-2 rounded-xl"
            disabled={!inputText.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
