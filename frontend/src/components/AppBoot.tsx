'use client'

import { useEffect } from 'react'
import { useSession } from '@/store/session'
import { useLedger } from '@/store/ledger'

/** Restores the session once, then keeps the household ledger in sync with it. */
export default function AppBoot() {
  const init = useSession((s) => s.init)
  const backend = useSession((s) => s.backend)
  const attach = useLedger((s) => s.attach)

  useEffect(() => { init() }, [init])
  useEffect(() => { attach(backend) }, [backend, attach])

  return null
}
