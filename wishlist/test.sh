#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

NODE=${DIR}/../build/snap/node/node.sh
APP=${DIR}/../build/snap/wishlist
WORK=$(mktemp -d)

${NODE} --version

cd ${APP}
SQLITE=$(ls -d node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3)
RE2=$(ls -d node_modules/.pnpm/re2@*/node_modules/re2)
${NODE} -e "new (require('./${SQLITE}'))(':memory:').prepare('select 1').get(); new (require('./${RE2}'))('a+').test('aa'); require('sharp')().metadata; console.log('native modules load ok')"

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
