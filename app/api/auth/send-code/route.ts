import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendVerificationCode, generateCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 频率限制：同一邮箱 60 秒内只能发一次
    const recentToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedEmail,
        expires: { gt: new Date(Date.now() - 60 * 1000) },
      },
    })

    if (recentToken) {
      return NextResponse.json(
        { error: '验证码已发送，请 60 秒后再试' },
        { status: 429 }
      )
    }

    const code = generateCode()
    const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 分钟有效

    // 清除旧验证码
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    })

    // 保存新验证码
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: code,
        expires,
      },
    })

    // 发送邮件
    await sendVerificationCode(normalizedEmail, code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json(
      { error: '发送验证码失败，请稍后重试' },
      { status: 500 }
    )
  }
}
