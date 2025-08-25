#!/bin/sh
# File: .git/hooks/pre-push
# chmod +x .git/hooks/pre-push

echo "🔍 Running pre-push checks..."

# === 1. Basic lint check for trailing spaces ===
grep -n '[[:space:]]$' $(git ls-files '*.js') && {
    echo "❌ Trailing spaces found!"
    exit 1
}

# === 2. Console.log usage check ===
IGNORE_FILE="src/env.js"  # <-- adjust this to where isDevBuild() is defined
FILES=$(git ls-files '*.js' | grep -v "$IGNORE_FILE")

invalid_logs=""

for file in $FILES; do
    inside_isDev_block=0
    block_depth=0

    while IFS= read -r line; do
        # Track block depth for { }
        opens=$(echo "$line" | grep -o "{" | wc -l)
        closes=$(echo "$line" | grep -o "}" | wc -l)
        block_depth=$((block_depth + opens - closes))

        # Detect entering an if (isDev) block
        echo "$line" | grep -Eq '^\s*if\s*\(\s*isDev\s*\)\s*{?' && {
            inside_isDev_block=1
        }

        # Reset when leaving block
        if [ $block_depth -le 0 ]; then
            inside_isDev_block=0
        fi

        # Handle console.log lines
        echo "$line" | grep -q "console\.log" || continue

        # Allowed patterns:
        #   if (isDev) console.log(...)
        #   isDev && console.log(...)
        echo "$line" | grep -Eq '^\s*if\s*\(\s*isDev\s*\)\s*console\.log' && continue
        echo "$line" | grep -Eq '^\s*isDev\s*&&\s*console\.log' && continue

        # Allowed if inside isDev block
        if [ $inside_isDev_block -eq 1 ]; then
            continue
        fi

        # Otherwise it's invalid
        invalid_logs="$invalid_logs\n$file:$line"
    done < "$file"
done

if [ -n "$invalid_logs" ]; then
    echo "❌ Found unguarded console.log statements:"
    echo -e "$invalid_logs"
    exit 1
fi

echo "✅ All checks passed. Push allowed."
exit 0
