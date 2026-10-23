#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

NODE=${DIR}/../build/snap/node/node.sh
APP=${DIR}/../build/snap/wishlist
WORK=$(mktemp -d)

${NODE} --version

cd ${APP}
${NODE} -e "new (require('better-sqlite3'))(':memory:').prepare('select 1').get(); require('sharp'); require('re2'); console.log('native modules load ok')"

export DATABASE_URL=file:${WORK}/test.db
export SOCKET_PATH=${WORK}/wishlist.sock
export ORIGIN=http://localhost
export PRISMA_HIDE_UPDATE_MESSAGE=1

${NODE} node_modules/prisma/build/index.js migrate deploy
${NODE} --import tsx prisma/seed.ts
${NODE} --import tsx prisma/patches/index.ts

${NODE} build &
PID=$!
trap "kill ${PID} 2>/dev/null || true; rm -rf ${WORK}" EXIT

for i in $(seq 1 60); do
  if [[ -S ${SOCKET_PATH} ]]; then
    break
  fi
  sleep 1
done

CODE=$(curl -s -o /dev/null -w '%{http_code}' --unix-socket ${SOCKET_PATH} http://localhost/login)
[[ "${CODE}" == "302" || "${CODE}" == "200" ]]
