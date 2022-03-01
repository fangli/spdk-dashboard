#!/bin/bash -e

rm -f spdk-dashboard

cd public
npm install
npm run build-dist
cd ..

rm -rf build
mkdir -p build

go get
GOOS=windows GOARCH=amd64 go build -o build/windows-x86_64/spdk_dashboard.exe
GOOS=linux GOARCH=amd64 go build -o build/linux-x86_64/spdk_dashboard
GOOS=linux GOARCH=arm64 go build -o build/linux-arm64/spdk_dashboard
GOOS=darwin GOARCH=amd64 go build -o build/macos-x86_64/spdk_dashboard
GOOS=freebsd GOARCH=amd64 go build -o build/freebsd-x86_64/spdk_dashboard

cp -f README.md LICENSE build/windows-x86_64/
cp -f README.md LICENSE build/linux-x86_64/
cp -f README.md LICENSE build/linux-arm64/
cp -f README.md LICENSE build/macos-x86_64/
cp -f README.md LICENSE build/freebsd-x86_64/

cd build

cd windows-x86_64/
zip spdk_dashboard-windows-x86_64.zip spdk_dashboard.exe LICENSE README.md
cd ..

cd linux-x86_64/
tar zcf spdk_dashboard-linux-x86_64.tar.gz spdk_dashboard LICENSE README.md
cd ..

cd linux-arm64/
tar zcf spdk_dashboard-linux-arm64.tar.gz spdk_dashboard LICENSE README.md
cd ..

cd macos-x86_64/
tar zcf spdk_dashboard-macos-x86_64.tar.gz spdk_dashboard LICENSE README.md
cd ..

cd freebsd-x86_64/
tar zcf spdk_dashboard-freebsd-x86_64.tar.gz spdk_dashboard LICENSE README.md
cd ..

echo "------------------"
echo "The binary has been built to directory build/. Binary spdk_dashboard is the ONLY file that needs to be deployed."
echo "Done."
