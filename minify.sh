#!/bin/bash

# Simple script to run uglifyjs via yarn.
# Assumes yarn has been run to pull the harmony branch of uglifyJS2.
# Could check for yarn/npm availability, but no need yet.

yarn run uglifyjs -- stickystack.js -m -c -v --mangle-props > stickystack.min.js
