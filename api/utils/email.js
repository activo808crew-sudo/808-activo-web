import { Resend } from 'resend';

const resend = new Resend(process.env.EMAIL_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@808.lat';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Send verification email to new staff member
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @returns {Promise<object>} Email send result
 */
export async function sendVerificationEmail(email, token) {
  console.log(`[Email Service] Attempting to send verification to: ${email}`);
  const verificationUrl = `${FRONTEND_URL}/staff/verify?token=${encodeURIComponent(token)}`;

  // Development / Fallback mode
  if (!process.env.EMAIL_API_KEY || process.env.EMAIL_API_KEY.includes('123456789')) {
    console.log('\n==================================================');
    console.log('📨 [DEV MODE] Email Mock - Verification');
    console.log(`To: ${email}`);
    console.log(`Subject: Verifica tu cuenta`);
    console.log(`LINK: ${verificationUrl}`);
    console.log('==================================================\n');
    return { success: true, result: { id: 'mock_email_id' } };
  }

  console.log('[Email Service] Using REAL Email API Key to send...');
  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '808 Activo - Verifica tu cuenta de Staff',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #1a103c 0%, #0a0319 100%);
              border-radius: 12px;
              padding: 40px;
              text-align: center;
            }
            .logo {
              background: white;
              color: black;
              width: 80px;
              height: 80px;
              line-height: 80px;
              border-radius: 12px;
              font-weight: bold;
              font-size: 32px;
              margin: 0 auto 20px;
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
            }
            h1 {
              color: white;
              margin-bottom: 10px;
            }
            p {
              color: #d1d5db;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
              color: white;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 8px;
              font-weight: bold;
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #9ca3af;
            }
            .link {
              color: #a78bfa;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">808</div>
            <h1>¡Bienvenido al Staff de 808 Activo! 👋</h1>
            <p>
              Tu cuenta de staff ha sido creada exitosamente.<br>
              Para activarla, por favor verifica tu correo electrónico.
            </p>
            <a href="${verificationUrl}" class="button">VERIFICAR EMAIL</a>
            <div class="footer">
              <p>
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <span class="link">${verificationUrl}</span>
              </p>
              <p>
                Este enlace expira en 24 horas.<br>
                Si no solicitaste esta cuenta, puedes ignorar este mensaje.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, result };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email after verification
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @returns {Promise<object>} Email send result
 */
export async function sendWelcomeEmail(email, name) {
  // Development / Fallback mode
  if (!process.env.EMAIL_API_KEY || process.env.EMAIL_API_KEY.includes('123456789')) {
    console.log('\n==================================================');
    console.log('📨 [DEV MODE] Email Mock - Welcome');
    console.log(`To: ${email}`);
    console.log('==================================================\n');
    return { success: true, result: { id: 'mock_email_id' } };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '808 Activo - ¡Cuenta verificada!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #1a103c 0%, #0a0319 100%);
              border-radius: 12px;
              padding: 40px;
              text-align: center;
            }
            .logo {
              background: white;
              color: black;
              width: 80px;
              height: 80px;
              line-height: 80px;
              border-radius: 12px;
              font-weight: bold;
              font-size: 32px;
              margin: 0 auto 20px;
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
            }
            h1 {
              color: white;
              margin-bottom: 10px;
            }
            p {
              color: #d1d5db;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
              color: white;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 8px;
              font-weight: bold;
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">808</div>
            <h1>¡Email verificado exitosamente! ✅</h1>
            <p>
              ${name ? `Hola ${name}, ` : ''}Tu cuenta de staff está ahora activa.<br>
              Ya puedes iniciar sesión y empezar a gestionar eventos.
            </p>
            <a href="${FRONTEND_URL}/staff" class="button">IR AL PANEL DE STAFF</a>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, result };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send staff key to director/owner
 * @param {string} email - Recipient email
 * @param {string} staffKey - Generated staff key
 * @returns {Promise<object>} Email send result
 */
export async function sendStaffKeyEmail(email, staffKey) {
  // Development / Fallback mode
  if (!process.env.EMAIL_API_KEY || process.env.EMAIL_API_KEY.includes('123456789')) {
    console.log('\n==================================================');
    console.log('📨 [DEV MODE] Email Mock - New Staff Key');
    console.log(`To: ${email}`);
    console.log(`Key: ${staffKey}`);
    console.log('==================================================\n');
    return { success: true, result: { id: 'mock_email_id' } };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '808 Activo - Nueva clave de Staff generada',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #1a103c 0%, #0a0319 100%);
              border-radius: 12px;
              padding: 40px;
              text-align: center;
            }
            .logo {
              background: white;
              color: black;
              width: 80px;
              height: 80px;
              line-height: 80px;
              border-radius: 12px;
              font-weight: bold;
              font-size: 32px;
              margin: 0 auto 20px;
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
            }
            h1 {
              color: white;
              margin-bottom: 10px;
            }
            p {
              color: #d1d5db;
              margin-bottom: 20px;
            }
            .key {
              background: rgba(0, 0, 0, 0.3);
              border: 2px solid #8b5cf6;
              border-radius: 8px;
              padding: 20px;
              font-family: monospace;
              font-size: 18px;
              color: #a78bfa;
              word-break: break-all;
              margin: 30px 0;
            }
            .warning {
              color: #fbbf24;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">808</div>
            <h1>Nueva clave de Staff generada 🔑</h1>
            <p>Has generado una nueva clave para registro de staff:</p>
            <div class="key">${staffKey}</div>
            <p class="warning">
              ⚠️ Esta clave expira en 7 días y solo puede usarse una vez.<br>
              Compártela solo con personas de confianza.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, result };
  } catch (error) {
    console.error('Error sending staff key email:', error);
    return { success: false, error: error.message };
  }
}
