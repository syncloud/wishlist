#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd ${DIR}

BIN_OUT=${DIR}/../build/snap/bin
HOOKS_OUT=${DIR}/../build/snap/meta/hooks
mkdir -p ${BIN_OUT} ${HOOKS_OUT}

go vet ./...
go test ./...

CGO_ENABLED=0 go build -buildvcs=false -o ${HOOKS_OUT}/configure ./cmd/configure
CGO_ENABLED=0 go build -buildvcs=false -o ${BIN_OUT}/cli         ./cmd/cli
