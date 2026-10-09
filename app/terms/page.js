export const metadata = {
  title: "Terms of Service | Videa",
  description: "Read the terms that apply when using the Videa platform."
};

const sections = [
  {
    title: "1. About Videa",
    paragraphs: [
      "Videa is a platform for discovering and watching eligible videos, earning platform points, and using creator features. Features may change as the service develops."
    ]
  },
  {
    title: "2. Eligibility and accounts",
    paragraphs: [
      "You must be legally able to use Videa under the laws that apply to you. Provide accurate account information, keep your sign-in credentials and devices secure, and do not impersonate another person or create accounts for deceptive purposes.",
      "You are responsible for activity on your account. Contact Videa if you believe your account has been accessed without permission. We may restrict or suspend accounts involved in fraud, abuse, or violations of these terms."
    ]
  },
  {
    title: "3. Watching videos and earning points",
    paragraphs: [
      "Points are platform rewards, not cash, unless Videa explicitly offers and approves a conversion or withdrawal option. Points are calculated according to the rules, eligibility requirements, limits, and verification checks displayed by Videa at the time of use.",
      "Videa may validate video details and viewing activity on its servers. Merely opening a video does not guarantee points. We may refuse, reverse, or adjust rewards associated with incomplete, invalid, duplicated, automated, or otherwise suspicious activity, subject to applicable law."
    ]
  },
  {
    title: "4. YouTube subscription verification",
    paragraphs: [
      "Some videos or rewards may require you to verify that you subscribe to the relevant YouTube channel. If you choose to verify, you authorize Videa to use the YouTube read-only permission requested through Google to check subscription status.",
      "Videa does not own or control YouTube. YouTube availability, account settings, API limits, and Google's authorization or verification requirements may affect this feature. Videa cannot guarantee that a subscription check will always be available."
    ]
  },
  {
    title: "5. Points, wallets, payments, and creator subscriptions",
    paragraphs: [
      "Your Videa balance and transaction history are platform records. Any deposit, withdrawal, creator subscription, or other payment-related feature is subject to the instructions, eligibility rules, fees (if any), limits, and approval process shown in Videa.",
      "A submitted payment request is not necessarily an approved or completed payment. Do not assume that points have monetary value or that a withdrawal is guaranteed unless Videa confirms it. You are responsible for providing accurate information needed to review a request."
    ]
  },
  {
    title: "6. Prohibited activity",
    paragraphs: [
      "You must not use bots, scripts, fake accounts, click farms, misleading activity, or other methods to manipulate views, subscription checks, points, referrals, or payments. You must not interfere with Videa's security, access another user's account without permission, upload unlawful content, or use the service to violate another person's rights."
    ]
  },
  {
    title: "7. Creator content and third-party services",
    paragraphs: [
      "Creators are responsible for having the rights and permissions needed for content they submit and for ensuring that their content and channel details are accurate. Videa may remove or disable content that violates these terms or applicable law.",
      "Videa may link to or rely on third-party services, including Google and YouTube. Those services are governed by their own terms and privacy policies, and Videa is not responsible for services it does not control."
    ]
  },
  {
    title: "8. Availability and changes",
    paragraphs: [
      "We work to keep Videa available, but do not guarantee uninterrupted or error-free operation. We may update, suspend, or discontinue features for maintenance, security, legal, or business reasons."
    ]
  },
  {
    title: "9. Disclaimers and liability",
    paragraphs: [
      "To the extent permitted by applicable law, Videa is provided on an available basis without guarantees that every feature will meet every user's expectations. Nothing in these terms excludes rights or liability that cannot legally be excluded."
    ]
  },
  {
    title: "10. Suspension and termination",
    paragraphs: [
      "You may stop using Videa at any time. We may limit or suspend access if reasonably necessary to protect users, investigate suspected abuse, comply with law, or enforce these terms. Where appropriate, contact us to discuss an account or balance issue."
    ]
  },
  {
    title: "11. Changes to these terms",
    paragraphs: [
      "We may revise these terms as the service changes. The updated version will be published on this page with a revised date. Continued use after an update means you accept the updated terms to the extent permitted by applicable law."
    ]
  },
  {
    title: "12. Contact",
    paragraphs: [
      "Questions about these terms can be sent to mantrap006@gmail.com."
    ]
  }
];

export default function TermsPage() {
  return (
    <article className="legal-page">
      <div className="eyebrow">CLEAR RULES. BETTER EXPERIENCE.</div>
      <h1 className="legal-title">Terms of <span>Service</span></h1>
      <p className="legal-intro">These terms explain the basic rules for using Videa, including watching videos, earning points, verifying YouTube subscriptions, and using creator or payment-related features.</p>
      <p className="legal-updated">Last updated: October 9, 2026</p>
      {sections.map((section) => (
        <section className="legal-section" key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
    </article>
  );
}
