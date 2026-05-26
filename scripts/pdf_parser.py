#!/usr/bin/env python3
"""
PDF Parser for 不背单词 App exported PDF files.
Uses pdfplumber's extract_words() with coordinate-based merging to handle fragmented text.
"""

import sys
import json
import re
from typing import List


def extract_words_from_pdf(pdf_path: str) -> List[str]:
    """
    Extract English words from a PDF file exported by 不背单词 App.
    Uses extract_words() with x_tolerance/y_tolerance to merge fragmented text blocks.

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
                # Use extract_words with tolerance to merge fragmented text blocks
                # x_tolerance: horizontal spacing tolerance (merge "pr" and "imarily")
                # y_tolerance: vertical spacing tolerance for same line
                word_objects = page.extract_words(
                    x_tolerance=4,
                    y_tolerance=3,
                    keep_blank_chars=False,
                    use_text_flow=False
                )

                for word_obj in word_objects:
                    text = word_obj.get('text', '').strip()
                    if not text:
                        continue

                    # Clean and validate the word
                    cleaned = clean_word(text)
                    if cleaned and cleaned not in seen:
                        seen.add(cleaned)
                        words.append(cleaned)

    except Exception as e:
        print(f"Error parsing PDF: {e}", file=sys.stderr)
        return []

    return words


def clean_word(text: str) -> str:
    """
    Clean a single word extracted from PDF.
    Returns cleaned lowercase word or empty string if invalid.

    Args:
        text: Raw text from PDF

    Returns:
        Cleaned word or empty string
    """
    if not text:
        return ""

    # Remove leading/trailing whitespace
    text = text.strip()

    # Skip if empty
    if not text:
        return ""

    # Skip checkbox symbol
    if text == '☐':
        return ""

    # Skip pure numbers
    if re.match(r'^\d+$', text):
        return ""

    # Skip Chinese characters (contains any Chinese)
    if re.search(r'[一-鿿]', text):
        return ""

    # Skip fixed text patterns from 不背单词
    noise_patterns = [
        r'^Word$',
        r'^Meaning$',
        r'^Example$',
        r'^专单',
        r'^不背单词',
        r'^Word\s*Meaning$',
    ]
    for pattern in noise_patterns:
        if re.match(pattern, text, re.IGNORECASE):
            return ""

    # Skip part-of-speech abbreviations
    pos_abbreviations = {
        'adv', 'adj', 'vi', 'vt', 'n', 'vlink', 'prep',
        'conj', 'pron', 'int', 'aux', 'det', 'art'
    }
    if text.lower().rstrip('.') in pos_abbreviations:
        return ""

    # Skip single letter with period (like "n.")
    if re.match(r'^[a-zA-Z]\.$', text):
        return ""

    # Extract English word (may contain hyphens or apostrophes)
    # Match patterns like: word, well-known, it's
    match = re.match(r"^([a-zA-Z]+(?:[-'][a-zA-Z]+)*)$", text)
    if not match:
        # Try to extract word from text with trailing numbers/periods
        # Like "primarily1" or "primary."
        match = re.match(r'^([a-zA-Z]+)[-.\d]*$', text)
        if not match:
            return ""

    word = match.group(1).lower()

    # Skip if too short (less than 2 characters)
    if len(word) < 2:
        return ""

    # Skip common noise words
    if is_common_noise(word):
        return ""

    return word


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
