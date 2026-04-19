#!/bin/bash
sed -i '/- name: Build Extension/,+1d' .github/workflows/build-extension.yml
sed -i '/- name: Create build directory/i\
      - name: Build Extension\
        run: pnpm run build\
' .github/workflows/build-extension.yml
