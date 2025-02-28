import requests
from pathlib import Path

def download_and_extract_words(url, output_file, min_length=4, max_length=7):
    try:
        # Download the file
        response = requests.get(url)
        response.raise_for_status()
        content = response.text
        
        # Process the content
        single_words = set()  # Using set to avoid duplicates
        
        for line in content.splitlines():
            parts = line.strip().split('\t')
            if len(parts) >= 3:
                word = parts[2].strip()
                # Check if it's a single word and within length constraints
                word_length = len(word)
                if ' ' not in word and min_length <= word_length <= max_length:
                    single_words.add(word)
        
        # Create the output directory if it doesn't exist
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write words to output file
        with open(output_file, 'w', encoding='utf-8') as f:
            for word in sorted(single_words):
                f.write(word + '\n')
                
        print(f"Successfully extracted {len(single_words)} unique words")
        print(f"Words have been saved to {output_file}")
        print(f"All words are between {min_length} and {max_length} characters long")
        
    except requests.RequestException as e:
        print(f"Error downloading the file: {e}")
    except Exception as e:
        print(f"Error processing the file: {e}")

if __name__ == "__main__":
    url = "https://raw.githubusercontent.com/kbatsuren/monwn/refs/heads/master/wn-data-mon.tsv"
    output_file = "data/mongolian_words_5_letters.txt"
    download_and_extract_words(url, output_file)
