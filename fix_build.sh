#!/bin/bash
sed -i 's/cp -r extension\/\*/cp -r dist\/\*/g' .github/workflows/build-extension.yml

# We need to insert a proper step for Build Extension in build-extension.yml
sed -i '/- name: Create build directory/i\
      - name: Build Extension\
        run: pnpm run build\
' .github/workflows/build-extension.yml
