import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { SITE_URL, SUPPORT_URL } from '@/lib/config'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" intro={<>
      <strong>In short:</strong> we collect only what you type into Kinfold plus your email and name. We don’t run ads, don’t sell data and don’t use tracking
      cookies. Your household’s data is protected by database-level access rules, stored with Supabase in Mumbai, and you can export or delete it whenever you like.
    </>}>
      <h2>1. Scope</h2>
      <p>
        This policy explains how Kinfold handles personal data when you use the web app at <a href={SITE_URL}>{SITE_URL.replace('https://', '')}</a> and the Kinfold Android app.
        It is written to meet India’s Digital Personal Data Protection Act, 2023 (DPDP Act) and comparable laws such as the GDPR.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> your name, email address and a securely hashed password (handled by Supabase Auth). Optionally a phone number.</li>
        <li><strong>Household data you enter:</strong> amounts, descriptions, categories, dates, budgets, bills, goals, chores, chat messages, vehicle, trip, investment, insurance and tax-proof records, and your stated monthly income.</li>
        <li><strong>Technical data:</strong> our hosting providers keep standard server logs (such as IP address, browser type and timestamps) for security and reliability.</li>
        <li><strong>On your device:</strong> the app stores your sign-in session, theme preference and — if you use it — the demo household in your browser’s local storage. These are not tracking cookies.</li>
      </ul>
      <p>We do <strong>not</strong> collect bank credentials, card details, UPI PINs, contacts, location or advertising identifiers.</p>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To provide the Service: show your household’s records, calculate totals and insights, and keep family members in sync.</li>
        <li>To secure the Service: authenticate you, prevent abuse and investigate problems.</li>
        <li>To contact you about your account: confirmation and password-reset emails, and important changes to these policies.</li>
      </ul>
      <p>We process your data on the basis of your consent and to perform our agreement with you. We do not use your data for advertising or sell it to anyone.</p>

      <h2>4. Who can see your data</h2>
      <ul>
        <li><strong>Your household:</strong> members see shared entries and each other’s names, roles and stated income. Entries you mark private are visible only to you — this is enforced by Postgres Row Level Security, not just by the app.</li>
        <li><strong>Service providers (processors):</strong> Supabase, Inc. (database and authentication, data stored in the AWS ap-south-1 Mumbai region) and Vercel, Inc. (web hosting). They process data only on our instructions.</li>
        <li><strong>Legal requirements:</strong> we may disclose data if required by law or to protect the rights and safety of users.</li>
      </ul>

      <h2>5. How long we keep it</h2>
      <p>
        We keep your data while your account exists. When you delete your account, your login, profile, private entries, income records, tax proofs, chat
        messages and personal budgets are deleted. Shared household entries remain for the other members but are no longer linked to your identity. If you were the only
        member, the entire household is deleted. Residual copies in our providers’ backups expire on their standard schedule.
      </p>

      <h2>6. Your rights</h2>
      <ul>
        <li><strong>Access and portability:</strong> download your data any time from Settings → Your data (CSV and JSON).</li>
        <li><strong>Correction:</strong> edit your profile and entries directly in the app.</li>
        <li><strong>Erasure and withdrawal of consent:</strong> delete your account from Settings → Delete account.</li>
        <li><strong>Grievance redressal:</strong> raise a concern via the contact below; we aim to respond within 30 days. Under the DPDP Act you may also approach the Data Protection Board of India.</li>
      </ul>

      <h2>7. Children</h2>
      <p>Kinfold accounts are for adults. Children and teenagers may be added only to a household created by a parent or guardian, who consents to the processing of their data and controls what they can see.</p>

      <h2>8. Security</h2>
      <p>
        Data is encrypted in transit (HTTPS/TLS) and at rest by our providers. Every database row is checked against your household membership by Row Level Security,
        and sensitive actions (approvals, wallet changes) run as audited server-side functions that re-check your role. No system is perfectly secure; please use a
        strong, unique password.
      </p>

      <h2>9. Changes</h2>
      <p>We will update the “last updated” date when this policy changes and notify you in the app before material changes take effect.</p>

      <h2>10. Contact</h2>
      <p>Privacy questions or requests: open an issue at <a href={SUPPORT_URL}>{SUPPORT_URL.replace('https://', '')}</a> (do not post personal data publicly — ask for a private contact channel).</p>
    </LegalPage>
  )
}
