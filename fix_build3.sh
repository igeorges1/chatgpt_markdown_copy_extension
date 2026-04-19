#!/bin/bash
# First, change all "cp -r extension" to "cp -r dist" in build-extension.yml
sed -i 's/cp -r extension\/\*/cp -r dist\/\*/g' .github/workflows/build-extension.yml

# Then inject "pnpm run build" for both jobs (but build-safari is missing pnpm install!)

# Let's just manually patch it using Python to avoid sed pain
python3 -c "
import re

with open('.github/workflows/build-extension.yml', 'r') as f:
    content = f.read()

# Add pnpm install and pnpm run build to build-safari job before creating directory
content = re.sub(
    r'(      - name: Create build directory\n        run: mkdir -p build)',
    r'''      - name: Setup Node.js
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Extension
        run: pnpm run build

\1''',
    content
)

# For build-chrome-firefox, just add Build Extension before Create build directory
content = re.sub(
    r'(\n      - name: Create build directory\n        run: mkdir -p build)',
    r'\n      - name: Build Extension\n        run: pnpm run build\n\1',
    content,
    count=1
)

with open('.github/workflows/build-extension.yml', 'w') as f:
    f.write(content)
"
