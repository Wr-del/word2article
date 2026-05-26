#!/usr/bin/env python3
"""
Test script for PDF parser.
"""

import sys
import os

# Add the scripts directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

from pdf_parser import clean_word, is_common_noise


def test_clean_word():
    """Test the clean_word function."""
    print("Testing clean_word...")

    # Test normal word
    assert clean_word("primarily") == "primarily", f"Expected 'primarily', got '{clean_word('primarily')}'"

    # Test word with number suffix
    assert clean_word("primary2") == "primary", f"Expected 'primary', got '{clean_word('primary2')}'"

    # Test word with period suffix
    assert clean_word("primary.") == "primary", f"Expected 'primary', got '{clean_word('primary.')}'"

    # Test hyphenated word
    assert clean_word("well-known") == "well-known", f"Expected 'well-known', got '{clean_word('well-known')}'"

    # Test word with apostrophe
    assert clean_word("it's") == "it's", f"Expected \"it's\", got '{clean_word('it')}'"

    # Test checkbox symbol
    assert clean_word("☐") == "", f"Expected '', got '{clean_word('☐')}'"

    # Test pure number
    assert clean_word("123") == "", f"Expected '', got '{clean_word('123')}'"

    # Test Chinese text
    assert clean_word("专单") == "", f"Expected '', got '{clean_word('专单')}'"

    # Test noise patterns
    assert clean_word("Word") == "", f"Expected '', got '{clean_word('Word')}'"
    assert clean_word("Meaning") == "", f"Expected '', got '{clean_word('Meaning')}'"
    assert clean_word("不背单词") == "", f"Expected '', got '{clean_word('不背单词')}'"

    # Test POS abbreviations
    assert clean_word("adv") == "", f"Expected '', got '{clean_word('adv')}'"
    assert clean_word("adj.") == "", f"Expected '', got '{clean_word('adj.')}'"
    assert clean_word("vi.") == "", f"Expected '', got '{clean_word('vi.')}'"

    # Test single letter with period
    assert clean_word("n.") == "", f"Expected '', got '{clean_word('n.')}'"

    # Test too short
    assert clean_word("a") == "", f"Expected '', got '{clean_word('a')}'"

    print("PASS: clean_word tests passed")


def test_is_common_noise():
    """Test the is_common_noise function."""
    print("Testing is_common_noise...")

    assert is_common_noise("the") == True
    assert is_common_noise("and") == True
    assert is_common_noise("primarily") == False
    assert is_common_noise("ironic") == False

    print("PASS: is_common_noise tests passed")


if __name__ == "__main__":
    test_clean_word()
    test_is_common_noise()
    print("\nPASS: All tests passed!")
