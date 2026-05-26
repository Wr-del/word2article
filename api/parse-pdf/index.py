import json
import sys
import os

# 添加scripts目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))

from pdf_parser import extract_words_from_pdf

def handler(request):
    """Vercel Python Serverless Function handler"""
    try:
        # 获取上传的文件
        if request.method != 'POST':
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }

        # 从请求体获取PDF文件
        content_type = request.headers.get('content-type', '')
        if 'multipart/form-data' not in content_type:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Content-Type must be multipart/form-data'})
            }

        # 解析multipart form data
        body = request.body
        if isinstance(body, str):
            body = body.encode()

        # 简单的multipart解析
        boundary = content_type.split('boundary=')[1]
        parts = body.split(f'--{boundary}'.encode())

        pdf_data = None
        for part in parts:
            if b'filename="' in part and b'.pdf' in part:
                # 提取文件内容
                header_end = part.find(b'\r\n\r\n')
                if header_end != -1:
                    pdf_data = part[header_end + 4:]
                    # 移除尾部的\r\n
                    if pdf_data.endswith(b'\r\n'):
                        pdf_data = pdf_data[:-2]

        if not pdf_data:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No PDF file found'})
            }

        # 保存临时文件并解析
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(pdf_data)
            tmp_path = tmp.name

        try:
            words = extract_words_from_pdf(tmp_path)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'words': words})
            }
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
