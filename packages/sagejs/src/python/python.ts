import wasmImport from "../wasm";

export let wasm: any = undefined;
export async function init() {
  wasm = await wasmImport("python");
}
init();
