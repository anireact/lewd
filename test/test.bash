#!/usr/bin/env bash

set -e

NODE_OPTIONS="$NODE_OPTIONS --expose-gc"
NODE_OPTIONS="$NODE_OPTIONS --enable-source-maps"
NODE_OPTIONS="$NODE_OPTIONS --experimental-vm-modules"
NODE_OPTIONS="$NODE_OPTIONS --disable-warning=ExperimentalWarning"

export NODE_OPTIONS

yarn make
yarn jest "$@"  
