export const metadata = {
  title: "Privacy Policy | Videa",
  description: "Learn how Videa collects, uses, and protects information when you use the Videa platform."
};

const sections = [
  {
    title: "1. Information we collect",
    paragraphs: [
      "When you create or use a Videa account, we may process your name, email address, Google account identifier, account role, and account status so we can provide sign-in and account features.",
      "We also process platform activity needed to operate Videa, such as videos viewed, subscription-verification results, points earned, wallet or transaction records, creator subscription status, and support requests."
    ]
  },
  {
    title: "2. Google sign-in and YouTube subscription checks",
    paragraphs: [
      "Videa uses Google sign-in to authenticate users. If you choose to verify that you subscribe to a YouTube channel, Videa asks for YouTube read-only permission and uses it to check whether your Google/YouTube account subscribes to the relevant channel.",
      "The subscription check sends an authorization token to Google/YouTube for the check. Videa uses the result to record a short-lived verification proof for your Videa account. We do not need your Google password, and you should never share it with Videa.",
      "You can decline the requested permission, but subscription-gated features that require verification may not work. You can review or revoke third-party access in your Google Account security settings."
    ]
  },
  {
    title: "3. How we use information",
    paragraphs: [
      "We use information to create and secure accounts; operate video viewing and creator features; verify channel subscriptions; calculate and display points; maintain wallet, payment-review, and subscription records; prevent fraud and abuse; respond to support requests; and maintain or improve Videa."
    ]
  },
  {
    title: "4. Cookies and security",
    paragraphs: [
      "Videa uses essential cookies, including an HTTP-only session cookie, to keep you signed in and a short-lived verification cookie to remember a successful channel-subscription check. These cookies support core platform functionality.",
      "We use reasonable technical and organizational safeguards, but no website or method of storage can be guaranteed completely secure. Keep your account and device secure and contact us if you suspect unauthorized use."
    ]
  },
  {
    title: "5. How information is shared",
    paragraphs: [
      "We do not sell your personal information. Information may be processed by service providers needed to run Videa, including hosting and database providers, and by Google/YouTube when you use their sign-in or subscription-verification services. We may also disclose information when required by law or when reasonably necessary to protect the rights, safety, and security of users or Videa."
    ]
  },
  {
    title: "6. Retention and your choices",
    paragraphs: [
      "We keep information for as long as reasonably necessary to operate your account, maintain points and transaction records, meet legal or security needs, and resolve disputes. Retention periods may vary by data type.",
      "You can stop using Google/YouTube authorization and revoke Videa's access through your Google Account. You may contact us to ask about access, correction, or deletion of personal information. Some records may need to be retained where required for legitimate operational, security, or legal reasons."
    ]
  },
  {
    title: "7. Children's privacy",
    paragraphs: [
      "Videa is not intended for children who are not legally able to use the service under applicable law. If you believe a child has provided personal information inappropriately, contact us so we can review the request."
    ]
  },
  {
    title: "8. Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy as Videa changes. We will publish the updated version on this page and revise the date below. Continued use of Videa after an update means the revised policy applies to future use."
    ]
  },
  {
    title: "9. Contact",
    paragraphs: [
      "For privacy questions or requests, contact mantrap006@gmail.com."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <article className="legal-page">
      <div className="eyebrow">YOUR PRIVACY MATTERS</div>
      <h1 className="legal-title">Privacy <span>Policy</span></h1>
      <p className="legal-intro">This policy explains how Videa handles information when you use our watch-and-earn platform, creator features, and YouTube subscription verification.</p>
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
