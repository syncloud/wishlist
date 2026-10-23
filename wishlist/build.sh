#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

REPO=$1
REF=$2
VERSION=$3

SRC=${DIR}/../build/wishlist-src
APP_OUT=${DIR}/../build/snap/wishlist
rm -rf ${SRC} ${APP_OUT}
mkdir -p ${SRC} ${APP_OUT}

cd ${SRC}
git init -q
git remote add origin ${REPO}
for i in $(seq 1 10); do
  if git fetch -q --depth 1 origin ${REF}; then
    break
  fi
  if [[ $i -eq 10 ]]; then
    exit 1
  fi
  sleep 10
done
git checkout -q FETCH_HEAD

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable pnpm

for i in $(seq 1 5); do
  if pnpm install --frozen-lockfile; then
    break
  fi
  if [[ $i -eq 5 ]]; then
    exit 1
  fi
  sleep 10
done

pnpm exec svelte-kit sync
pnpm prisma generate
VERSION=${VERSION} SHA=$(git rev-parse HEAD) pnpm build

case $(uname -m) in
  x86_64) CPU=x64 ;;
  aarch64) CPU=arm64 ;;
  *) echo "unsupported arch $(uname -m)"; exit 1 ;;
esac
rm -rf node_modules
for i in $(seq 1 5); do
  if pnpm install --frozen-lockfile --prod --os linux --cpu ${CPU} --libc glibc; then
    break
  fi
  if [[ $i -eq 5 ]]; then
    exit 1
  fi
  sleep 10
done

cp -a build node_modules package.json prisma prisma.config.ts templates ${APP_OUT}
mkdir -p ${APP_OUT}/src/lib/generated
cp -a src/lib/generated/prisma ${APP_OUT}/src/lib/generated/prisma
ln -s /var/snap/wishlist/current/uploads ${APP_OUT}/uploads

du -sh ${APP_OUT}
