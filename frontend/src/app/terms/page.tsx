import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { REPO_URL, SITE_URL, SUPPORT_URL } from '@/lib/config'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" intro={<>
      <strong>In short:</strong> Kinfold is a free record-keeping app for households. It never moves money, never connects to your bank, and does not give
      financial advice. You own the data you enter and can delete it any time. Use it lawfully and keep your login safe.
    </>}>
      <h2>1. Who we are and what these terms cover</h2>
      <p>
        Kinfold (“Kinfold”, “we”, “us”) is an open-source household finance application. These Terms of Service govern your use of the Kinfold web app
        at <a href={SITE_URL}>{SITE_URL.replace('https://', '')}</a>, the Kinfold Android app, and related services (together, the “Service”).
        By creating an account or using the Service you agree to these terms and to our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>2. Who can use Kinfold</h2>
      <ul>
        <li>You must be at least 18 years old to create an account and a household.</li>
        <li>People under 18 may use Kinfold only as a member of a household created by their parent or guardian, who is responsible for that use and consents to it on their behalf.</li>
        <li>You must give accurate account information and keep your password confidential. You are responsible for activity under your account.</li>
      </ul>

      <h2>3. What the Service does — and does not do</h2>
      <ul>
        <li>Kinfold helps you <strong>record and organise</strong> household expenses, income, budgets, bills, shared costs, goals and related information that you enter yourself.</li>
        <li>Kinfold is <strong>not a bank, wallet, payment system or lender</strong>. The “Pocket money” wallet, settlements and reimbursements only record money moved outside Kinfold (for example by UPI or cash). No real money is held or transferred by us.</li>
        <li>Kinfold does not ask for, and you must not enter, bank login details, card numbers, CVVs, UPI PINs or OTPs.</li>
        <li>Calculations, insights, health scores, forecasts, tax and insurance figures are <strong>educational estimates based on your own entries</strong>. They are not financial, investment, tax, legal or insurance advice. Consult a qualified professional before acting on them.</li>
      </ul>

      <h2>4. Households and shared data</h2>
      <ul>
        <li>A household is shared by its members. Entries marked shared are visible to every member; entries marked private are visible only to the person who created or paid them.</li>
        <li>The household head and parents can approve requests, manage chores, change roles and permissions, and invite or remove members. Share your invite code only with people you trust.</li>
        <li>If you leave a household or delete your account, shared entries you created stay with the household so its records remain complete, but they are no longer linked to your name.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to: break any law; upload unlawful, abusive or infringing content; attempt to access another household’s data; probe, disrupt or overload the Service; reverse-engineer security controls of the hosted Service; or use Kinfold to harass others.</p>

      <h2>6. Your content</h2>
      <p>
        You keep all rights to the information you enter. You give us a limited licence to store, process and display it solely to operate the Service for you and
        your household. You can export your data (Settings → Your data) and delete your account (Settings → Delete account) at any time.
      </p>

      <h2>7. Demo mode</h2>
      <p>The demo household contains fictional sample data. Anything you change in the demo is stored only in your browser and is never sent to our servers.</p>

      <h2>8. Open-source software</h2>
      <p>
        Kinfold’s source code is published at <a href={REPO_URL}>{REPO_URL.replace('https://', '')}</a> under the MIT Licence. The MIT Licence governs the code; these
        Terms govern use of the hosted Service. If you run your own copy, you are the operator of that copy and responsible for it.
      </p>

      <h2>9. Availability, changes and fees</h2>
      <p>The Service is currently provided free of charge. We may change, suspend or discontinue features. We will try to give reasonable notice of significant changes and will let you export your data before any shutdown.</p>

      <h2>10. Disclaimer and limitation of liability</h2>
      <p>
        The Service is provided “as is” and “as available”, without warranties of any kind to the extent permitted by law. We do not guarantee that it will be
        uninterrupted, error-free or that calculations will suit your circumstances. To the maximum extent permitted by law, we are not liable for indirect or
        consequential losses, or for decisions you make based on information in the Service. Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>11. Ending your use</h2>
      <p>You may stop using Kinfold and delete your account at any time. We may suspend accounts that seriously or repeatedly break these terms, after notice where practical.</p>

      <h2>12. Governing law</h2>
      <p>These terms are governed by the laws of India. Courts in India have jurisdiction, without prejudice to any mandatory consumer rights you have where you live.</p>

      <h2>13. Changes to these terms</h2>
      <p>We may update these terms. The “last updated” date above will change, and for material changes we will notify you in the app before they take effect.</p>

      <h2>14. Contact</h2>
      <p>Questions or concerns: open an issue at <a href={SUPPORT_URL}>{SUPPORT_URL.replace('https://', '')}</a>.</p>
    </LegalPage>
  )
}
