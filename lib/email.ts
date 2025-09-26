import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendGiftEmailParams {
  recipientEmail: string;
  giftId: string;
  authenticationCode: string;
  amount: number;
  message?: string;
  senderEmail: string;
}

export async function sendGiftEmail({
  recipientEmail,
  giftId,
  authenticationCode,
  amount,
  message,
  senderEmail,
}: SendGiftEmailParams) {
  // Create a redirect URL that goes to dashboard first, then to the gift
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const giftUrl = `${baseUrl}/claim/${giftId}`;
  const dashboardUrl = `${baseUrl}/dashboard?gift=${giftId}`;
  const formattedAmount = (amount / 100).toFixed(2);

  // Use Resend development domain for testing
  // TODO: Change to your domain email when you have a custom domain verified in Resend
  const fromEmail = 'MonnieGift <hello@resend.dev>';
  
  // For development/testing: Only send to verified email addresses
  // In production with domain verification, this restriction can be removed
  const verifiedEmails = ['enes@semwerkt.nl']; // Add more verified emails as needed
  
  if (!verifiedEmails.includes(recipientEmail)) {
    
    // Return a mock success response for development
    return {
      id: `mock-${Date.now()}`,
      message: `Email would be sent to ${recipientEmail} in production`
    };
  }

  try {
    
    const emailData = {
      from: fromEmail,
      to: [recipientEmail],
      subject: `🎁 Je hebt een gift van €${formattedAmount} ontvangen!`,
      text: `Je hebt een gift van €${formattedAmount} ontvangen van ${senderEmail}!

Authenticatie Code: ${authenticationCode}

Klik hier om je gift op te halen: ${giftUrl}

${message ? `Bericht: "${message}"` : ''}

Met vriendelijke groet,
Het MonnieGift Team`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fdfbf7;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0a2d27 0%, #1a584e 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 8px rgba(10, 45, 39, 0.1);">
            <h1 style="color: #fdfbf7; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🎁 MonnieGift</h1>
            <p style="color: #d4b483; margin: 12px 0 0 0; font-size: 18px; font-weight: 500;">Je hebt een gift ontvangen!</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9e3d8; box-shadow: 0 4px 8px rgba(10, 45, 39, 0.05);">
            <!-- Amount Display -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="background: linear-gradient(135deg, #d4b483 0%, #e4c59a 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(212, 180, 131, 0.2);">
                <h2 style="color: #0a2d27; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -1px;">€${formattedAmount}</h2>
              </div>
              <p style="color: #556b68; margin: 0; font-size: 16px; font-weight: 500;">van ${senderEmail}</p>
            </div>
            
            <!-- Message -->
            ${message ? `
              <div style="background: #fdfbf7; padding: 24px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #d4b483; border: 1px solid #e9e3d8;">
                <p style="margin: 0; color: #0a2d27; font-style: italic; font-size: 16px; line-height: 1.6;">"${message}"</p>
              </div>
            ` : ''}
            
            <!-- Authentication Code -->
            <div style="background: #fdfbf7; padding: 24px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #1a584e; box-shadow: 0 2px 4px rgba(26, 88, 78, 0.1);">
              <h3 style="color: #1a584e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">🔐 Authenticatie Code</h3>
              <div style="background: #0a2d27; padding: 20px; border-radius: 8px; text-align: center; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);">
                <span style="font-size: 28px; font-weight: 700; color: #d4b483; letter-spacing: 4px; font-family: 'Fira Code', monospace;">${authenticationCode}</span>
              </div>
              <p style="color: #556b68; margin: 16px 0 0 0; font-size: 14px; text-align: center;">Gebruik deze code om je gift te claimen</p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${giftUrl}" style="background: linear-gradient(135deg, #0a2d27 0%, #1a584e 100%); color: #fdfbf7; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; display: inline-block; box-shadow: 0 4px 8px rgba(10, 45, 39, 0.2); transition: all 0.2s ease;">
                Claim je Gift Nu
              </a>
            </div>
            
            <!-- Info Box -->
            <div style="margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #e9e3d8 0%, #f3f4f6 100%); border-radius: 12px; border-left: 4px solid #d4b483;">
              <p style="margin: 0; color: #0a2d27; font-size: 14px; font-weight: 500; line-height: 1.5;">
                💡 <strong>Nieuwe gebruiker?</strong> We helpen je automatisch met het opzetten van je account om het geld te ontvangen.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e9e3d8; text-align: center;">
              <p style="color: #556b68; margin: 0 0 12px 0; font-size: 14px;">
                Of kopieer en plak deze link in je browser:
              </p>
              <a href="${giftUrl}" style="color: #1a584e; word-break: break-all; font-size: 12px; text-decoration: underline;">${giftUrl}</a>
            </div>
          </div>
        </div>
      `,
        };

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }

    return data;
      } catch (error) {
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}
