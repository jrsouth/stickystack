#!/bin/bash

# Simple script to run babel and uglifyjs via yarn.
# Assumes yarn has been run to pull the harmony branch of uglifyJS2.
# Could check for yarn/npm availability, but no need yet.

# Errors:
 yarn run babel -- stickystack.js -o stickystack.es5.js

#./node_modules/.bin/babel stickystack.js --out-file stickystack.es5.js

yarn run uglifyjs -- stickystack.js -m -c -v --comments --stats -o stickystack.min.js
yarn run uglifyjs -- stickystack.es5.js -m -c -v --comments --stats -o stickystack.es5.min.js


