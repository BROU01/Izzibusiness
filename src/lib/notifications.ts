import { createServiceClient } from '@/lib/supabase/server';

interface NotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'transaction' | 'game' | 'referral';
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  sendSMS?: boolean;
  phoneNumber?: string;
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SMSParams {
  phone: string;
  message: string;
}

/**
 * Creer une notification en base et optionnellement envoyer email/SMS
 */
export async function createNotification(params: NotificationParams): Promise<string | null> {
  const supabase = createServiceClient();

  // 1. Creer la notification en base
  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: params.userId,
    p_title: params.title,
    p_message: params.message,
    p_type: params.type,
    p_action_url: params.actionUrl || null,
    p_metadata: JSON.stringify(params.metadata || {}),
  });

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  // 2. Envoyer l'email si demande
  if (params.sendEmail) {
    const { data: user } = await supabase.auth.admin.getUserById(params.userId);
    if (user?.user?.email) {
      await sendEmailNotification({
        to: user.user.email,
        subject: params.title,
        html: buildEmailTemplate(params.title, params.message, params.actionUrl),
      });
    }
  }

  // 3. Envoyer le SMS si demande
  if (params.sendSMS && params.phoneNumber) {
    await sendSMSNotification({
      phone: params.phoneNumber,
      message: `${params.title}: ${params.message}`,
    });
  }

  return data;
}

/**
 * Envoyer un email de notification
 */
async function sendEmailNotification(params: EmailParams): Promise<boolean> {
  try {
    // En production, integrer un service d'email (Resend, SendGrid, etc.)
    // Pour l'instant, logger l'email
    console.log('[EMAIL NOTIFICATION]', {
      to: params.to,
      subject: params.subject,
      html: params.html.substring(0, 100) + '...',
    });

    // TODO: Integrer un vrai service d'email
    // Exemple avec Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@izzibusiness.com',
    //   to: params.to,
    //   subject: params.subject,
    //   html: params.html,
    // });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Envoyer un SMS de notification
 */
async function sendSMSNotification(params: SMSParams): Promise<boolean> {
  try {
    // En production, integrer un service SMS (Twilio, Beem, etc.)
    // Pour l'instant, logger le SMS
    console.log('[SMS NOTIFICATION]', {
      phone: params.phone,
      message: params.message,
    });

    // TODO: Integrer un vrai service SMS
    // Exemple avec Twilio:
    // const client = new twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: params.message,
    //   to: params.phone,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Construire le template HTML pour les emails
 */
function buildEmailTemplate(title: string, message: string, actionUrl?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f4;">
      <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #1c1917;">
          ${title}
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 24px;">
          ${message}
        </p>
        ${
          actionUrl
            ? `
          <a href="${actionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Voir les details
          </a>
        `
            : ''
        }
      </div>
      <p style="font-size: 12px; color: #a8a29e; text-align: center; margin-top: 24px;">
        Izzibusiness - Ne pas repondre a cet email
      </p>
    </body>
    </html>
  `;
}

// ============================================
// Templates predefinis pour les transactions
// ============================================

export const NOTIFICATION_TEMPLATES = {
  // Depot recu
  depositSuccess: (amount: number, provider: string) => ({
    title: 'Depot recu',
    message: `Votre depot de ${amount.toLocaleString()} FCFA via ${provider} a ete credite sur votre wallet.`,
    type: 'transaction' as const,
    actionUrl: '/dashboard/wallet',
  }),

  // Retrait initie
  withdrawInitiated: (amount: number, provider: string) => ({
    title: 'Retrait en cours',
    message: `Votre retrait de ${amount.toLocaleString()} FCFA vers ${provider} est en cours de traitement. Delai: 1-24h.`,
    type: 'transaction' as const,
    actionUrl: '/dashboard/wallet',
  }),

  // Retrait complete
  withdrawCompleted: (amount: number, provider: string) => ({
    title: 'Retrait effectue',
    message: `Votre retrait de ${amount.toLocaleString()} FCFA a ete envoye sur votre compte ${provider}.`,
    type: 'success' as const,
    actionUrl: '/dashboard/wallet',
    sendSMS: true,
  }),

  // Gain de jeu
  gameWin: (game: string, amount: number, multiplier: number) => ({
    title: `Gain au ${game}`,
    message: `Felicitations ! Vous avez gagne ${amount.toLocaleString()} FCFA au ${game} (multiplicateur ${multiplier}x).`,
    type: 'game' as const,
    actionUrl: '/dashboard/games',
  }),

  // Perde de jeu
  gameLoss: (game: string, amount: number) => ({
    title: `Partie perdue - ${game}`,
    message: `Vous avez perdu ${amount.toLocaleString()} FCFA au ${game}. Retentez votre chance !`,
    type: 'info' as const,
    actionUrl: '/games',
  }),

  // Parrainage
  referralBonus: (referrerName: string, amount: number) => ({
    title: 'Bonus parrainage',
    message: `${referrerName} s'est inscrit avec votre lien. Vous recevez ${amount.toLocaleString()} FCFA !`,
    type: 'referral' as const,
    actionUrl: '/dashboard/referrals',
  }),

  // Mission completee
  missionCompleted: (missionTitle: string, reward: number) => ({
    title: 'Mission completee',
    message: `Vous avez complete la mission "${missionTitle}". Recompense: ${reward.toLocaleString()} FCFA.`,
    type: 'success' as const,
    actionUrl: '/dashboard/missions',
  }),

  // Bienvenue
  welcome: (name: string) => ({
    title: 'Bienvenue sur Izzibusiness',
    message: `Bonjour ${name}, bienvenue sur Izzibusiness ! Completez votre profil pour commencer.`,
    type: 'info' as const,
    actionUrl: '/dashboard/profile',
  }),

  // Securite: connexion
  newLogin: (device: string, location: string) => ({
    title: 'Nouvelle connexion',
    message: `Une connexion a ete detectee depuis ${device} a ${location}. Si ce n'est pas vous, changez votre mot de passe.`,
    type: 'warning' as const,
  }),
};
