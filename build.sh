#!/bin/bash -ex

rm -f spdk-dashboard

cd public
npm install
npm run build-dist
cd ..

rm -rf build

mkdir -p build/linux-x86_64
mkdir -p build/linux-arm64
mkdir -p build/macos-x86_64

go get
GOOS=linux GOARCH=amd64 go build -o build/linux-x86_64/spdk_dashboard
GOOS=linux GOARCH=arm64 go build -o build/linux-arm64/spdk_dashboard
GOOS=darwin GOARCH=amd64 go build -o build/macos-x86_64/spdk_dashboard

echo "------------------"
echo "The binary has been built to directory build/. Binary spdk_dashboard is the ONLY file that needs to be deployed."
echo "Done."
