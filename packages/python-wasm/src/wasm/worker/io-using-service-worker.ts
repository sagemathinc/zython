import type { IOHandlerClass } from "./types";
import debug from "debug";

const log = debug("wasm:worker:io-using-atomics");

const SIGNAL_CHECK_MS = 500;

export default class IOHandler implements IOHandlerClass {
  private id: string;
  private lastSignalCheck: number = 0;
  private serviceWorkerBroken: Function;

  constructor(opts, serviceWorkerBroken: Function) {
    log(opts);
    this.id = opts.id;
    this.serviceWorkerBroken = serviceWorkerBroken;
    if (this.id == null) {
      throw Error(`${this.id} must be a v4 uuid`);
    }
  }

  private request(
    url: "sleep" | "read-stdin" | "read-signal",
    body: object = {}
  ) {
    const request = new XMLHttpRequest();
    request.open("POST", `/python-wasm-sw/${url}`, false); // false = synchronous
    request.setRequestHeader("cache-control", "no-cache, no-store, max-age=0");
    try {
      request.send(JSON.stringify(body));
    } catch (err) {
      this.serviceWorkerBroken();
      warnBroken(err);
    }
    if (request.status != 200 && request.status != 304) {
      this.serviceWorkerBroken();
      warnBroken(`invalid status=${request.status}`);
    }
    return request;
  }

  sleep(milliseconds: number): void {
    log("sleep ", milliseconds);
    const start = new Date().valueOf();
    while (new Date().valueOf() - start <= milliseconds) {
      try {
        this.request("sleep", { ms: Math.min(milliseconds, 500) });
      } catch (err) {
        log("sleep error", err);
        return;
      }
      if (this.getSignal(false)) {
        // TODO: there could be signals that maybe don't interrupt sleep?
        return;
      }
    }
  }

  getStdin(): Buffer {
    // Despite blocking, this doesn't block control+c signal because
    // we send "^C" to stdin when getting that signal.
    const request = this.request("read-stdin", { id: this.id });
    if (request.status == 200) {
      return Buffer.from(request.responseText ?? "");
    } else {
      // python will try again soon.
      return Buffer.from("");
    }
  }

  private getSignal(clear: boolean): number {
    const request = this.request("read-signal", { clear, id: this.id });
    return parseInt(request.responseText) ?? 0;
  }

  // Python kernel will call this VERY frequently, which is fine for
  // checking an atomic, but NOT for using xmlhttprequest.
  getSignalState(): number {
    const now = new Date().valueOf();
    if (now - this.lastSignalCheck < SIGNAL_CHECK_MS) {
      return 0;
    }
    this.lastSignalCheck = now;
    return this.getSignal(true);
  }
}

function warnBroken(err, milliseconds: number = 3000) {
  // Something strongly suggests the service worker isn't working, e.g., which would happen over
  // non https non localhost (or even firefox incognito in all cases).
  // If we just silently ignore this, then we'll likely DOS our server, so instead we do a CPU
  // consuming lock for a while, since I don't know what else to do.  This burns CPU, but stops DOS.
  // OK, upon experimenting, it turns out this sort of thing happens every once in a while.
  // In some cases, it can happen constantly, e.g., Firefox over http, so we do guard against it.
  console.warn(
    "service worker not working, so burning CPU to avoid DOS'ing the server -- ",
    err
  );
  const t0 = new Date().valueOf();
  while (new Date().valueOf() - t0 <= milliseconds) {}
}
