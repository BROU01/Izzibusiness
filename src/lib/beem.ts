// Beem Africa SMS/OTP API
// Documentation: https://docs.beem.africa/

const BEEM_API_URL = 'https://api.beem.africa';
const BEEM_API_KEY = process.env.BEEM_API_KEY || '';
const BEEM_SECRET_KEY = process.env.BEEM_SECRET_KEY || '';
const BEEM_SENDER_ID = process.env.BEEM_SENDER_ID || '';

interface SendOTPResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  verified: boolean;
}

/**
 * Générer un code OTP à 6 chiffres
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envoyer un SMS OTP
 */
export async function sendOTP(phone: string, code: string): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${BEEM_API_URL}/send/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${BEEM_API_KEY}:${BEEM_SECRET_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({
        phone: phone,
        code: code,
        expiry: '300', // 5 minutes
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: 'OTP envoyé avec succès',
        requestId: data.requestId,
      };
    }

    return {
      success: false,
      message: data.message || "Erreur lors de l'envoi de l'OTP",
    };
  } catch {
    return {
      success: false,
      message: 'Erreur de connexion au serveur Beem',
    };
  }
}

/**
 * Vérifier un code OTP
 */
export async function verifyOTP(phone: string, code: string): Promise<VerifyOTPResponse> {
  try {
    const response = await fetch(`${BEEM_API_URL}/verify/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${BEEM_API_KEY}:${BEEM_SECRET_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({
        phone: phone,
        code: code,
      }),
    });

    const data = await response.json();

    if (response.ok && data.verified) {
      return {
        success: true,
        message: 'OTP vérifié avec succès',
        verified: true,
      };
    }

    return {
      success: false,
      message: data.message || 'Code OTP invalide ou expiré',
      verified: false,
    };
  } catch {
    return {
      success: false,
      message: 'Erreur de connexion au serveur Beem',
      verified: false,
    };
  }
}

/**
 * Envoyer un SMS transactionnel (notification)
 */
export async function sendSMS(phone: string, message: string): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${BEEM_API_URL}/send/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${BEEM_API_KEY}:${BEEM_SECRET_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
        sender: BEEM_SENDER_ID,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: 'SMS envoyé avec succès',
      };
    }

    return {
      success: false,
      message: data.message || "Erreur lors de l'envoi du SMS",
    };
  } catch {
    return {
      success: false,
      message: 'Erreur de connexion au serveur Beem',
    };
  }
}
