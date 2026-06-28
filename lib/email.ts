import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendVerificationCode(email: string, code: string) {
  if (!resend) {
    console.error('RESEND_API_KEY not configured')
    throw new Error('Email service not configured')
  }

  await resend.emails.send({
    from: 'Word2Article <onboarding@resend.dev>',
    to: email,
    subject: 'Word2Article 登录验证码',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8127cf; font-size: 24px; margin: 0;">Word2Article</h1>
          <p style="color: #666; font-size: 14px; margin-top: 8px;">你的登录验证码</p>
        </div>
        <div style="background: #f8f4ff; border: 1px solid #e8dff5; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="color: #333; font-size: 14px; margin: 0 0 12px;">验证码如下：</p>
          <div style="font-size: 36px; font-weight: bold; color: #8127cf; letter-spacing: 8px;">${code}</div>
          <p style="color: #999; font-size: 12px; margin: 16px 0 0;">验证码 5 分钟内有效，请勿泄露给他人</p>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          如果你没有请求此验证码，请忽略此邮件
        </p>
      </div>
    `,
  })
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
