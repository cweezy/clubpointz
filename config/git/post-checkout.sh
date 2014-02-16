#!/bin/sh

# source gitConfig on git checkout
cd $(git rev-parse --show-toplevel)
source gitConfig
