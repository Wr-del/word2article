import json
import tempfile
import os
from pdf_parser import extract_words_from_pdf

def handler(request):
    """Vercel Python Serverless Function handler"""
    try:
        if request.method != 'POST':
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }

        content_type = request.headers.get('content-type', '')

        if 'multipart/form-data' not in content_type:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Content-Type must be multipart/form-data'})
            }

        # 使用python-multipart解析form data
        from multipart import parse_options_header, MultipartParser

        ct, options = parse_options_header(content_type)
        boundary = options.get('boundary', '').encode()

        if not boundary:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No boundary in Content-Type'})
            }

        body = request.body
        if isinstance(body, str):
            body = body.encode()

        parser = MultipartParser(boundary)
        parts = parser.parse(body)

        pdf_data = None
        for part in parts:
            if part.filename and '.pdf' in part.filename.lower():
                pdf_data = part.value
                break

        if not pdf_data:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No PDF file found'})
            }

        # 保存临时文件并解析
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            if isinstance(pdf_data, str):
                pdf_data = pdf_data.encode('latin-1')
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
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
