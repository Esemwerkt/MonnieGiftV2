import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use the same Resend configuration as lib/email.ts
if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set - survey emails will not be sent');
}
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { giftId, rating, feedback, improvements } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating is required and must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Insert survey response into database
    const { data, error } = await supabase
      .from('survey_responses')
      .insert({
        gift_id: giftId || null,
        rating,
        feedback: feedback || null,
        improvements: improvements || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving survey response:', error);
      return NextResponse.json(
        { error: 'Failed to save survey response' },
        { status: 500 }
      );
    }

    // Send notification email using the same email settings
    if (resend) {
      try {
        const fromEmail = 'MonnieGift <hello@resend.dev>';
        const adminEmail = process.env.ADMIN_EMAIL || 'enes@semwerkt.nl';
        
        console.log('Attempting to send survey email to:', adminEmail);
        
        // Get gift info if giftId exists
        let giftInfo = '';
        let giftInfoHtml = '';
        if (giftId) {
          const { data: gift, error: giftError } = await supabase
            .from('gifts')
            .select('amount, currency, senderEmail')
            .eq('id', giftId)
            .single();
          
          if (gift && !giftError) {
            const formattedAmount = (gift.amount / 100).toFixed(2);
            giftInfo = `\n\nGift Details:\n- Amount: €${formattedAmount} ${gift.currency}\n- Sender: ${gift.senderEmail || 'N/A'}`;
            giftInfoHtml = `
                  <div style="background: #e9e3d8; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="color: #0a2d27; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Gift Details</h3>
                    <p style="margin: 0; color: #0a2d27; font-size: 14px;">
                      Amount: €${formattedAmount} ${gift.currency}<br>
                    </p>
                  </div>
                `;
          }
        }

        const emailData = {
          from: fromEmail,
          to: [adminEmail],
          subject: `📊 Nieuwe Survey Response - Rating: ${rating}/5`,
          text: `Nieuwe survey response ontvangen:

Rating: ${rating}/5
${feedback ? `Feedback: ${feedback}` : 'Geen feedback opgegeven'}
${improvements ? `Verbeteringen: ${improvements}` : 'Geen verbeteringen opgegeven'}${giftInfo}

Datum: ${new Date().toLocaleString('nl-NL')}`,
          html: `
            <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fdfbf7;">
              <div style="background: linear-gradient(135deg, #0a2d27 0%, #1a584e 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: #fdfbf7; margin: 0; font-size: 32px; font-weight: 700;">📊 Nieuwe Survey Response</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9e3d8;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="background: linear-gradient(135deg, #d4b483 0%, #e4c59a 100%); padding: 20px; border-radius: 12px; display: inline-block;">
                    <h2 style="color: #0a2d27; margin: 0; font-size: 48px; font-weight: 700;">${rating}/5</h2>
                  </div>
                </div>
                
                ${feedback ? `
                  <div style="background: #fdfbf7; padding: 24px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #d4b483;">
                    <h3 style="color: #1a584e; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Wat vond je het beste?</h3>
                    <p style="margin: 0; color: #0a2d27; font-size: 16px; line-height: 1.6;">${feedback.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                  </div>
                ` : ''}
                
                ${improvements ? `
                  <div style="background: #fdfbf7; padding: 24px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #1a584e;">
                    <h3 style="color: #1a584e; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Wat kunnen we verbeteren?</h3>
                    <p style="margin: 0; color: #0a2d27; font-size: 16px; line-height: 1.6;">${improvements.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                  </div>
                ` : ''}
                
                ${giftInfoHtml}
                
                <div style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e9e3d8; text-align: center;">
                  <p style="color: #556b68; margin: 0; font-size: 14px;">
                    Ontvangen op: ${new Date().toLocaleString('nl-NL')}
                  </p>
                </div>
              </div>
            </div>
          `,
        };

        const emailResult = await resend.emails.send(emailData);
        
        if (emailResult.error) {
          console.error('Resend API error:', emailResult.error);
        } else {
          console.log('Survey email sent successfully:', emailResult.data);
        }
      } catch (emailError) {
        // Don't fail the request if email fails, but log the error
        console.error('Error sending survey notification email:', emailError);
        if (emailError instanceof Error) {
          console.error('Error message:', emailError.message);
          console.error('Error stack:', emailError.stack);
        }
      }
    } else {
      console.warn('Resend is not configured - survey email not sent');
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error processing survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

