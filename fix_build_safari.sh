#!/bin/bash
sed -i 's/pnpm run build/pnpm install --frozen-lockfile\n        pnpm run build/g' .github/workflows/build-extension.yml
