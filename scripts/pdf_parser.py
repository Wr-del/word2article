#!/usr/bin/env python3
"""
PDF Parser for 不背单词 App exported PDF files.
Uses pdfplumber to extract and clean English words from table-structured PDFs.
"""

import sys
import json
import re
from typing import List

def extract_words_from_pdf(pdf_path: str) -> List[str]:
    """
    Extract English words from a PDF file exported by 不背单词 App.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        List of unique English words in order of appearance
    """
    try:
        import pdfplumber
    except ImportError:
        print("Error: pdfplumber is not installed. Run: pip install pdfplumber", file=sys.stderr)
        return []

    words = []
    seen = set()

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                # Extract tables from the page
                tables = page.extract_tables()

                for table in tables:
                    if not table:
                        continue

                    for row in table:
                        if not row:
                            continue

                        # Process each cell in the row
                        for cell in row:
                            if not cell:
                                continue

                            # Clean and extract words from cell
                            extracted = clean_and_extract_words(cell)
                            for word in extracted:
                                if word not in seen:
                                    seen.add(word)
                                    words.append(word)

    except Exception as e:
        print(f"Error parsing PDF: {e}", file=sys.stderr)
        return []

    return words


def clean_and_extract_words(text: str) -> List[str]:
    """
    Clean text and extract English words.

    Args:
        text: Raw text from PDF cell

    Returns:
        List of cleaned English words
    """
    if not text:
        return []

    words = []

    # Split by newlines and process each line
    lines = text.split('\n')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Skip non-word content
        if is_noise(line):
            continue

        # Extract words from the line
        extracted = extract_words_from_line(line)
        words.extend(extracted)

    return words


def is_noise(text: str) -> bool:
    """
    Check if text is noise (not a valid word entry).

    Args:
        text: Text to check

    Returns:
        True if text is noise
    """
    # Filter patterns
    noise_patterns = [
        r'^☐$',  # Checkbox symbol
        r'^Word\s*Meaning$',  # Header
        r'^Word\n*Meaning$',  # Header with newline
        r'^专单',  # Chinese header
        r'^不背单词',  # App name
        r'^\d+$',  # Pure numbers
        r'^[a-zA-Z]\.$',  # Single letter with period
        r'^[A-Z]{2,}$',  # All caps (likely abbreviation)
    ]

    for pattern in noise_patterns:
        if re.match(pattern, text, re.IGNORECASE):
            return True

    # Check if text contains mostly non-ASCII characters (Chinese, etc.)
    non_ascii = sum(1 for c in text if ord(c) > 127)
    if non_ascii > len(text) * 0.5:
        return True

    return False


def extract_words_from_line(line: str) -> List[str]:
    """
    Extract English words from a line of text.

    Args:
        line: Line of text

    Returns:
        List of English words
    """
    words = []

    # Pattern to match English words (2+ characters)
    # Also handles cases like "1 primarily" or "primary 2"
    word_pattern = r'\b([a-zA-Z]{2,})\b'

    matches = re.findall(word_pattern, line)

    for word in matches:
        # Convert to lowercase
        word = word.lower()

        # Skip common noise words
        if is_common_noise(word):
            continue

        words.append(word)

    return words


def is_common_noise(word: str) -> bool:
    """
    Check if word is common noise (not a vocabulary word).

    Args:
        word: Word to check

    Returns:
        True if word is noise
    """
    noise_words = {
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
        'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
        'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
        'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
        'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now',
        'page', 'pdf', 'word', 'list', 'test', 'exam', 'unit', 'chapter',
        'meaning', 'example', 'sentence', 'translation', 'pronunciation'
    }

    return word in noise_words


def main():
    """
    Main entry point for command-line usage.
    """
    if len(sys.argv) < 2:
        print("Usage: python pdf_parser.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    words = extract_words_from_pdf(pdf_path)

    # Output as JSON
    print(json.dumps(words, ensure_ascii=False))


if __name__ == "__main__":
    main()
