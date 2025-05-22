#!/bin/bash

# Output file for collected code
OUTPUT_FILE="all_project_code.txt"

# File extensions to include
CODE_EXTENSIONS=("*.ts" "*.tsx" "*.js" "*.json")

# Start fresh
> "$OUTPUT_FILE"
echo "============= PROJECT CODE FILES =============" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to process each file
process_file() {
  local file_path="$1"

  echo "Processing: $file_path"

  echo "------- $file_path START --------" >> "$OUTPUT_FILE"
  iconv -f UTF-8 -t UTF-8 -c "$file_path" >> "$OUTPUT_FILE" 2>/dev/null || cat "$file_path" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "------- $file_path END --------" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
}

export -f process_file
export OUTPUT_FILE

# Build find command
echo "Finding code files and excluding node_modules and package-lock.json..."

for ext in "${CODE_EXTENSIONS[@]}"; do
  find . -type d -name "node_modules" -prune -o -type f -name "package-lock.json" -prune -o -type f -name "$ext" -print | while read -r file; do
    process_file "$file"
  done
done

echo "✅ All code collected into: $OUTPUT_FILE"