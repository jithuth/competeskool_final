export async function sendWelcomeEmail(email: string, role: string, name: string) {
  console.log(`[SIMULATED EMAIL] Sending Welcome Email to ${name} (${email}) as ${role}`);
  // We would integrate Appwrite functions or external SMTP here

  return true;
}

export async function sendApprovalNotification(email: string, name: string) {
  console.log(`[SIMULATED EMAIL] Sending Approval Notification to ${name} (${email})`);
  return true;
}
