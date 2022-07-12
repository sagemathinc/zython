BUILT = dist/.built

CWD = $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

export PATH := ${CWD}/bin:${CWD}/packages/zig/dist:$(PATH)

all: python-wasm webpack

packages/python-wasm/${BUILT}: cpython wasi zig wasm-posix
	cd packages/python-wasm && make all
.PHONY: python-wasm
python-wasm: packages/python-wasm/${BUILT}

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


packages/cpython/${BUILT}: wasm-posix zlib lzma zig wasi
	cd packages/cpython && make all
.PHONY: cpython
cpython: packages/cpython/${BUILT}


packages/wasi/${BUILT}:
	cd packages/wasi && make all
.PHONY: wasi
wasi: packages/wasi/${BUILT}


packages/jpython/${BUILT}: python-wasm
	cd packages/jpython && make all
.PHONY: jpython
jpython: packages/jpython/${BUILT}


packages/webpack/${BUILT}: python-wasm jpython
	cd packages/webpack && make all
.PHONY: webpack
webpack: packages/webpack/${BUILT}


.PHONY: docker
docker:
	docker build --build-arg commit=`git ls-remote -h https://github.com/sagemathinc/python-wasm master | awk '{print $$1}'` -t python-wasm .

.PHONY: docker-nocache
docker-nocache:
	docker build --no-cache -t python-wasm .

clean:
	cd packages/python-wasm && make clean
	cd packages/cpython && make clean
	cd packages/jpython && make clean
	cd packages/lzma && make clean
	cd packages/openssl && make clean
	cd packages/wasi && make clean
	cd packages/wasm-posix && make clean
	cd packages/webpack && make clean
	cd packages/zig && make clean
	cd packages/zlib && make clean

test: jpython python-wasm
	cd packages/jpython && make test
	cd packages/python-wasm && make test
