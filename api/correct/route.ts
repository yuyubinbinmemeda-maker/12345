import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { image, subject, studentName, grade } = await request.json()

    if (!image) {
      return NextResponse.json({ error: '没有接收到作业图片' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: '未在 .env.local 中配置 GEMINI_API_KEY' }, { status: 500 })
    }

    // 处理前端传来的 Base64 图片数据
    const base64Data = image.split(',')[1] || image
    const mimeType = image.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'

    // 调用官方 Gemini 3.1 Pro 多模态接口
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `你是一位经验丰富、严谨细致的K12全科名师。请帮这位学生（姓名：${studentName || '同学'}，年级：${grade || 'K12'}）批改这份【${subject || '数学'}】作业照片。
请完成以下任务：
1. 逐题仔细检查，精准识别手写计算、填空或解答过程中的对错。
2. 针对错题，精准剖析其错误根源（如概念不清、计算失误、审题偏差等）。
3. 给出清晰、详细、规范的标准解题步骤。
4. 附上一句鼓励、温暖的评语。`
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ]
        })
      }
    )

    const data = await response.json()
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '未能解析出批改结果'
    return NextResponse.json({ result: resultText })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}