// Static, professional invite-message template — deliberately not AI-generated
// (no LLM call, no variability run to run) so a coach can trust exactly what
// it says every time before sending it to a client.
export function buildInviteMessage(opts: {
  clientName: string;
  clientEmail: string;
  coachName: string;
  businessName?: string | null;
  inviteUrl: string;
}): string {
  const from = opts.businessName || opts.coachName;
  return `Hi ${opts.clientName},

${from} has invited you to get set up on CoachevaOS.

Here's how to get started:
1. Open this link: ${opts.inviteUrl}
2. Sign up using this email address: ${opts.clientEmail}
3. Create a password to finish your onboarding

Once you're set up, you can log back in anytime using that same email and password.

Looking forward to working with you!
${opts.coachName}`;
}
