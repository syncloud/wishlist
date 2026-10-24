#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

${DIR}/../build/snap/node/node.sh --version
test -f ${DIR}/../build/snap/wishlist/build/index.js
${DIR}/../build/snap/wishlist/schema-engine.sh --version
