#!/usr/bin/env python3
"""
Test script for PDF parser.
"""

import sys
import os

# Add the scripts directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

from pdf_parser import clean_and_extract_words, is_noise, extract_words_from_line, is_common_noise

def test_clean_and_extract_words():
    """Test the clean_and_extract_words function."""
    print("Testing clean_and_extract_words...")

    # Test normal word
    result = clean_and_extract_words("primarily")
    assert result == ["primarily"], f"Expected ['primarily'], got {result}"

    # Test word with number prefix
    result = clean_and_extract_words("1 primarily")
    assert result == ["primarily"], f"Expected ['primarily'], got {result}"

    # Test word with number suffix
    result = clean_and_extract_words("primary 2")
    assert result == ["primary"], f"Expected ['primary'], got {result}"

    # Test multiple words
    result = clean_and_extract_words("primarily\nprimary")
    assert result == ["primarily", "primary"], f"Expected ['primarily', 'primary'], got {result}"

    # Test with checkbox symbol
    result = clean_and_extract_words("☐")
    assert result == [], f"Expected [], got {result}"

    # Test with noise
    result = clean_and_extract_words("Word\nMeaning")
    assert result == [], f"Expected [], got {result}"

    print("PASS: clean_and_extract_words tests passed")

def test_is_noise():
    """Test the is_noise function."""
    print("Testing is_noise...")

    assert is_noise("☐") == True
    assert is_noise("Word\nMeaning") == True
    assert is_noise("专单 5月25日") == True
    assert is_noise("不背单词 App") == True
    assert is_noise("primarily") == False

    print("PASS: is_noise tests passed")

def test_extract_words_from_line():
    """Test the extract_words_from_line function."""
    print("Testing extract_words_from_line...")

    result = extract_words_from_line("1 primarily")
    assert result == ["primarily"], f"Expected ['primarily'], got {result}"

    result = extract_words_from_line("primary 2")
    assert result == ["primary"], f"Expected ['primary'], got {result}"

    result = extract_words_from_line("ironic criticize")
    assert result == ["ironic", "criticize"], f"Expected ['ironic', 'criticize'], got {result}"

    print("PASS: extract_words_from_line tests passed")

def test_is_common_noise():
    """Test the is_common_noise function."""
    print("Testing is_common_noise...")

    assert is_common_noise("the") == True
    assert is_common_noise("and") == True
    assert is_common_noise("primarily") == False
    assert is_common_noise("ironic") == False

    print("PASS: is_common_noise tests passed")

if __name__ == "__main__":
    test_clean_and_extract_words()
    test_is_noise()
    test_extract_words_from_line()
    test_is_common_noise()
    print("\nPASS: All tests passed!")
