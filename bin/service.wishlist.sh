#!/bin/bash -e

set -a
. ${SNAP_DATA}/config/wishlist.env
set +a

export NODE_ENV=production
export NODE_EXTRA_CA_CERTS=/var/snap/platform/current/syncloud.ca.crt
export PRISMA_HIDE_UPDATE_MESSAGE=1
export DATABASE_URL=file:${SNAP_DATA}/wishlist.db
export SOCKET_PATH=${SNAP_DATA}/wishlist.sock
export BODY_SIZE_LIMIT=5000000
export DEFAULT_CURRENCY=USD
export PUBLIC_DEFAULT_CURRENCY=USD
export TOKEN_TIME=72
export OIDC_ENABLE=true
export OIDC_CLIENT_ID=wishlist
export OIDC_PROVIDER_NAME=Syncloud
export OIDC_AUTO_REDIRECT=true
export OIDC_AUTO_REGISTER=true
export OIDC_ENABLE_SYNC=true
export OIDC_GROUPS_CLAIM=groups
export OIDC_ADMIN_GROUP=syncloud
export SECURITY_DISABLE_PASSWORD_LOGIN=true
export ENABLE_SIGNUP=false

NODE=${SNAP}/node/node.sh

/bin/rm -f ${SOCKET_PATH}

cd ${SNAP}/wishlist
${NODE} node_modules/prisma/build/index.js migrate deploy
${NODE} --import tsx prisma/seed.ts
${NODE} --import tsx prisma/patches/index.ts
exec ${NODE} build
