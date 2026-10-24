#!/bin/bash -e

${SNAP}/bin/wait-for-configure.sh

set -a
. ${SNAP_DATA}/config/wishlist.env
set +a

NODE=${SNAP}/node/node.sh

/bin/rm -f ${SOCKET_PATH}

cd ${SNAP}/wishlist
${NODE} node_modules/prisma/build/index.js migrate deploy
${NODE} --import tsx prisma/seed.ts
${NODE} --import tsx prisma/patches/index.ts
exec ${NODE} build
