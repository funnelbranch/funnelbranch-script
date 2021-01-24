#!/usr/bin/env bash

main=$(git rev-parse main)
deployed=$(curl -s https://js.funnelbranch.com/funnelbranch.js | sed -E 's/.*"([0-9a-f]{7})".*/\1/')

echo "Main branch:        ${main:0:7}"
echo "Deployed version:   ${deployed}"
