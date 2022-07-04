BUILT = dist/.built

CWD = $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

export PATH := ${CWD}/packages/zig/dist:$(PATH)

all: lib/${BUILT} jpython

lib/${BUILT}: python wasi zig wasm-posix
	cd lib && make all
.PHONY: lib
lib: lib/${BUILT}

.PHONY: zig
zig:
	cd packages/zig && make

packages/wasm-posix/${BUILT}: zig
	cd packages/wasm-posix && make all
.PHONY: wasm-posix
wasm-posix: packages/wasm-posix/${BUILT}

packages/openssl/${BUILT}: zig
	cd packages/openssl && make all
.PHONY: openssl
openssl: packages/openssl/${BUILT}


packages/lzma/${BUILT}: zig wasm-posix
	cd packages/lzma && make all
.PHONY: lzma
lzma: packages/lzma/${BUILT}


packages/zlib/${BUILT}: zig
	cd packages/zlib && make all
.PHONY: zlib
zlib: packages/zlib/${BUILT}


packages/python/${BUILT}: wasm-posix zlib lzma zig
	cd packages/python && make all
.PHONY: python
python: packages/python/${BUILT}


packages/wasi/${BUILT}:
	cd packages/wasi && make all
.PHONY: wasi
wasi: packages/wasi/${BUILT}


packages/jpython/${BUILT}: lib/${BUILT}
	cd packages/jpython && make all
.PHONY: jpython
jpython: packages/jpython/${BUILT}


.PHONY: docker
docker:
	docker build --build-arg commit=`git ls-remote -h https://github.com/sagemathinc/wapython master | awk '{print $$1}'` -t wapython .

.PHONY: docker-nocache
docker-nocache:
	docker build --no-cache -t wapython .

clean:
	cd packages/wasi && make clean
	cd packages/python && make clean
	cd packages/openssl && make clean
	cd packages/zlib && make clean
	cd packages/lzma && make clean
	cd packages/wasm-posix && make clean
	cd packages/zig && make clean
	cd packages/jpython && make clean
	cd lib && make clean

