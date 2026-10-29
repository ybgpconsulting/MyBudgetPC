var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// ../src/data/seedPhones.ts
var SEED_PHONES = [
  // ==========================================
  // SMARTPHONES
  // ==========================================
  {
    id: "phone-ip14pm-purple-128",
    category: "Phones",
    brand: "Apple",
    model: "iPhone 14 Pro Max",
    storage: "128GB",
    colour: "Deep Purple",
    colorHex: "#593d62",
    condition: "Like New (Flawless)",
    conditionDescription: "Stunning flagship with Dynamic Island and 48MP Pro camera. 100% original Apple OLED 120Hz display with TrueTone active. Stainless steel frame mirror finish. Zero scratches.",
    batteryHealth: 88,
    price: 62999,
    originalMsp: 139900,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-21",
    stockTag: "CK-IP14PM-881",
    screenSize: "6.7 inch",
    processor: "A16 Bionic",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Dynamic Island interactive notifications",
      "48MP Quad-Pixel sensor with Photonic Engine",
      "6.7-inch Super Retina XDR 120Hz ProMotion",
      "A16 Bionic 6-core processor",
      "Stainless steel surgical-grade chassis"
    ],
    inspectionPassed: [
      "Original Apple OLED Panel (TrueTone 100% Active)",
      "Face ID Optical & TrueDepth Sensor Passed",
      "Original Factory Battery (Zero BMS reprogramming)",
      "All 3 Stereo Microphones & Speakers Passed",
      "5G Dual SIM (Physical SIM + eSIM) Verified",
      "MagSafe 15W Wireless Fast Charging Passed"
    ]
  },
  {
    id: "phone-ip15pm-nat-256",
    category: "Phones",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    storage: "256GB",
    colour: "Natural Titanium",
    colorHex: "#94a3b8",
    condition: "Like New (Flawless)",
    conditionDescription: "Grade A+ pristine unit. Titanium aerospace frame with Action button and USB-C. Under remaining Apple Limited Warranty. 5x Optical Telephoto periscope camera.",
    batteryHealth: 96,
    price: 89999,
    originalMsp: 159900,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-21",
    stockTag: "CK-IP15PM-962",
    screenSize: "6.7 inch",
    processor: "A17 Pro",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: false,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Grade 5 Titanium lightweight frame with Action Button",
      "A17 Pro console-grade gaming chip (3nm)",
      "5x Telephoto optical zoom lens (120mm focal length)",
      "USB-C port with 10Gbps USB 3 data transfer",
      "Always-On ProMotion 120Hz display"
    ],
    inspectionPassed: [
      "Official Apple Limited Warranty active",
      "Titanium rails clean with zero dents",
      "Dynamic Island & Action button 100% functional",
      "Camera Sensor Shift OIS & 5x Zoom clear",
      "Original Battery Health verified on 3uTools"
    ]
  },
  {
    id: "phone-ip13pm-sierra-128",
    category: "Phones",
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    storage: "128GB",
    colour: "Sierra Blue",
    colorHex: "#93c5fd",
    condition: "Excellent (9.5/10)",
    conditionDescription: "Legendary battery longevity powerhouse. 120Hz ProMotion Super Retina XDR OLED display. Very well maintained with tempered glass and case since day 1.",
    batteryHealth: 87,
    price: 48999,
    originalMsp: 129900,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-20",
    stockTag: "CK-IP13PM-873",
    screenSize: "6.7 inch",
    processor: "A15 Bionic",
    images: [
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "6.7-inch ProMotion 120Hz Super Retina XDR",
      "A15 Bionic 5-core GPU processor",
      "Triple 12MP Pro camera with 3x optical zoom & Macro",
      "Stainless steel body with textured matte glass"
    ],
    inspectionPassed: [
      "Original Factory Display with TrueTone active",
      "Face ID sensor passed optical test",
      "3x Optical Zoom & Macro mode crystal sharp",
      "Original unboosted battery health 87%",
      "Dual speaker balanced acoustic output"
    ]
  },
  {
    id: "phone-s24u-titanium-256",
    category: "Phones",
    brand: "Samsung",
    model: "Galaxy S24 Ultra 5G",
    storage: "256GB",
    colour: "Titanium Gray",
    colorHex: "#64748b",
    condition: "Like New (Flawless)",
    conditionDescription: "Samsung Galaxy AI flagship! Flat Corning Gorilla Armor anti-reflective display, Titanium frame, 200MP Quad-Tele camera system, S-Pen included.",
    batteryHealth: 99,
    price: 79999,
    originalMsp: 129999,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-21",
    stockTag: "CK-S24U-991",
    screenSize: "6.8 inch",
    processor: "Snapdragon 8 Gen 3 for Galaxy",
    images: [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Galaxy AI (Circle to Search, Live Translate, Note Assist)",
      "Snapdragon 8 Gen 3 for Galaxy processor",
      "Flat 6.8-inch Dynamic AMOLED 2X 120Hz (2600 nits peak)",
      "200MP Main + 50MP 5x Optical + 10MP 3x Optical + 12MP Ultra-Wide",
      "Embedded Bluetooth S-Pen stylus"
    ],
    inspectionPassed: [
      "Gorilla Armor flat glass 100% scratch free",
      "S-Pen gesture controls & digitizer responsive",
      "200MP sensor and 100x Space Zoom verified",
      "Ultrasonic Fingerprint scanner responsive",
      "Samsung Knox security status untouched (0x0)"
    ]
  },
  {
    id: "phone-op12-emerald-256",
    category: "Phones",
    brand: "OnePlus",
    model: "OnePlus 12 5G",
    storage: "256GB",
    colour: "Flowy Emerald",
    colorHex: "#047857",
    condition: "Like New (Flawless)",
    conditionDescription: "Flagship killer powerhouse! 4th Gen Hasselblad camera with 64MP 3x periscope telephoto, 2K 120Hz ProXDR display, Snapdragon 8 Gen 3, 5400mAh battery.",
    batteryHealth: 99,
    price: 44999,
    originalMsp: 64999,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-21",
    stockTag: "CK-OP12-991",
    screenSize: "6.82 inch",
    processor: "Snapdragon 8 Gen 3",
    images: [
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Snapdragon 8 Gen 3 with 16GB LPDDR5X RAM",
      "Hasselblad Camera with 64MP Periscope Telephoto",
      "2K 120Hz ProXDR 4500 nits display with Aqua Touch",
      "5400 mAh Battery with 100W SuperVOOC"
    ],
    inspectionPassed: [
      "100W SuperVOOC charging verified",
      "Aqua Touch wet-hand touch functionality passed",
      "Hasselblad color sensor calibrated",
      "Original Battery Health 99%"
    ]
  },
  // ==========================================
  // WATCHES (SMARTWATCHES)
  // ==========================================
  {
    id: "watch-apple-ultra2-titanium",
    category: "Watches",
    brand: "Apple",
    model: "Apple Watch Ultra 2 (GPS + Cellular, 49mm)",
    storage: "64GB",
    colour: "Natural Titanium / Orange Ocean Band",
    colorHex: "#e2e8f0",
    condition: "Like New (Flawless)",
    conditionDescription: "The ultimate rugged outdoor smartwatch. 3000 nits edge-to-edge sapphire crystal display, dual-frequency precision GPS, Depth gauge, Action button.",
    batteryHealth: 98,
    price: 52999,
    originalMsp: 89900,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-20",
    stockTag: "CK-WT-U2-981",
    screenSize: "49mm Titanium Case",
    processor: "S9 SiP with Double Tap gesture",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "49mm aerospace-grade titanium case with raised sapphire edge",
      "3000 nits bright Always-On Retina display",
      "S9 SiP chip with Double Tap hand gesture control",
      "Precision dual-frequency GPS (L1 and L5)",
      "Up to 36 hours regular use / 72 hours low power mode"
    ],
    inspectionPassed: [
      "Sapphire front glass flawless without scratches",
      "ECG & Blood Oxygen optical sensors verified",
      "Digital Crown & Action button tactile feedback 100%",
      "Cellular eSIM activation tested",
      "Original Apple Magnetic Fast Charger included"
    ]
  },
  {
    id: "watch-apple-series9-starlight",
    category: "Watches",
    brand: "Apple",
    model: "Apple Watch Series 9 (GPS, 45mm)",
    storage: "64GB",
    colour: "Starlight Aluminum",
    colorHex: "#f5f5f4",
    condition: "Like New (Flawless)",
    conditionDescription: "Pristine condition. S9 chip with Double Tap gesture, 2000 nits display, fast charging. Clean starlight sport band.",
    batteryHealth: 99,
    price: 26999,
    originalMsp: 44900,
    priceDrop: true,
    featured: false,
    status: "Available",
    dateAdded: "2026-08-19",
    stockTag: "CK-WT-S9-991",
    screenSize: "45mm Aluminum",
    processor: "S9 SiP",
    images: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Double tap gesture navigation",
      "2000 nits edge-to-edge Retina display",
      "S9 SiP high speed dual-core processor",
      "Crash Detection & Fall Detection sensors"
    ],
    inspectionPassed: [
      "Original Display & Touch Digitizer passed",
      "Heart Rate & Temperature sensor passed",
      "Original unboosted battery health 99%",
      "Magnetic charging verified"
    ]
  },
  {
    id: "watch-galaxy-watch6-classic-47",
    category: "Watches",
    brand: "Samsung",
    model: "Galaxy Watch 6 Classic (Bluetooth + LTE, 47mm)",
    storage: "16GB",
    colour: "Black Stainless Steel",
    colorHex: "#1e293b",
    condition: "Like New (Flawless)",
    conditionDescription: "Iconic rotating mechanical bezel! Stainless steel premium case with sapphire crystal glass. Advanced Sleep Coaching & BioActive Sensor.",
    batteryHealth: 97,
    price: 18999,
    originalMsp: 40999,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-18",
    stockTag: "CK-WT-GW6C-971",
    screenSize: "47mm Classic (1.5 inch Super AMOLED)",
    processor: "Exynos W930 Dual-Core",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Physical rotating bezel with tactile haptic clicks",
      "Sapphire Crystal 2000 nits Super AMOLED display",
      "3-in-1 Samsung BioActive Sensor (ECG, BIA body composition, Optical HR)",
      "Wireless PowerShare compatible"
    ],
    inspectionPassed: [
      "Mechanical bezel rotation smooth & responsive",
      "BioActive Sensor passed calibration test",
      "LTE calling and Samsung Pay NFC tested",
      "Battery health 97% verified"
    ]
  },
  // ==========================================
  // TABLETS (iPads & Galaxy Tabs)
  // ==========================================
  {
    id: "tablet-ipad-pro-129-m2-256",
    category: "Tablets",
    brand: "Apple",
    model: "iPad Pro 12.9-inch (6th Gen, M2 Chip, Wi-Fi)",
    storage: "256GB",
    colour: "Space Gray",
    colorHex: "#334155",
    condition: "Like New (Flawless)",
    conditionDescription: "Pro computing powerhouse! Liquid Retina XDR Mini-LED display with 1600 nits peak brightness and 120Hz ProMotion. Apple M2 processor with Apple Pencil hover.",
    batteryHealth: 95,
    price: 68999,
    originalMsp: 122900,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-20",
    stockTag: "CK-TAB-IPM2-951",
    screenSize: "12.9 inch Liquid Retina XDR (Mini-LED)",
    ram: "8GB Unified",
    processor: "Apple M2 (8-core CPU, 10-core GPU)",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "12.9-inch Mini-LED Liquid Retina XDR 120Hz ProMotion",
      "Apple M2 8-core CPU / 10-core GPU / 16-core Neural Engine",
      "Apple Pencil 2nd Gen hover support",
      "Thunderbolt / USB 4 port (up to 40Gbps)",
      "Four speaker audio with Studio-quality mics"
    ],
    inspectionPassed: [
      "Mini-LED backlight zones 100% uniform (Zero dead pixels)",
      "Face ID camera array & Center Stage tested",
      "Thunderbolt video output & fast charging passed",
      "Apple Pencil magnetic charging dock verified"
    ]
  },
  {
    id: "tablet-ipad-air5-m1-64",
    category: "Tablets",
    brand: "Apple",
    model: "iPad Air (5th Gen, M1 Chip, Wi-Fi)",
    storage: "64GB",
    colour: "Blue",
    colorHex: "#38bdf8",
    condition: "Excellent (9.5/10)",
    conditionDescription: "Super lightweight with flagship Apple M1 silicon. 10.9-inch Liquid Retina TrueTone display, Touch ID in top button, stereo speakers in landscape.",
    batteryHealth: 93,
    price: 36999,
    originalMsp: 59900,
    priceDrop: true,
    featured: false,
    status: "Available",
    dateAdded: "2026-08-19",
    stockTag: "CK-TAB-AIR5-931",
    screenSize: "10.9 inch Liquid Retina",
    ram: "8GB Unified",
    processor: "Apple M1",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Apple M1 desktop-class chip",
      "10.9-inch Liquid Retina display with True Tone & P3 color",
      "Touch ID embedded in power button",
      "USB-C port with 2x faster transfer speeds"
    ],
    inspectionPassed: [
      "Original Apple Retina display verified",
      "Touch ID sensor instant recognition",
      "Landscape stereo speakers loud and clear",
      "Original battery health 93%"
    ]
  },
  {
    id: "tablet-samsung-tabs9-ultra-256",
    category: "Tablets",
    brand: "Samsung",
    model: "Galaxy Tab S9 Ultra (14.6-inch, Wi-Fi)",
    storage: "256GB",
    colour: "Graphite",
    colorHex: "#18181b",
    condition: "Like New (Flawless)",
    conditionDescription: "Colossal 14.6-inch Dynamic AMOLED 2X 120Hz display with S-Pen included! IP68 water & dust resistance, Snapdragon 8 Gen 2 for Galaxy, Samsung DeX workstation.",
    batteryHealth: 98,
    price: 64999,
    originalMsp: 108999,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-20",
    stockTag: "CK-TAB-S9U-981",
    screenSize: "14.6 inch Dynamic AMOLED 2X (120Hz)",
    ram: "12GB",
    processor: "Snapdragon 8 Gen 2 for Galaxy",
    images: [
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Massive 14.6-inch Dynamic AMOLED 2X 120Hz display",
      "Included IP68 bi-directional charging S-Pen",
      "Samsung Wireless DeX desktop workspace",
      "Quad AKG speakers with Dolby Atmos"
    ],
    inspectionPassed: [
      "14.6-inch AMOLED display zero tint or dead pixels",
      "S-Pen low latency writing tested",
      "Under-display optical fingerprint scanner passed",
      "Dual front 12MP ultrawide cameras verified"
    ]
  },
  // ==========================================
  // LAPTOPS (MacBooks & Ultrabooks)
  // ==========================================
  {
    id: "laptop-macbook-pro-14-m3pro-512",
    category: "Laptops",
    brand: "Apple",
    model: "MacBook Pro 14-inch (M3 Pro, 18GB Unified / 512GB SSD)",
    storage: "512GB",
    colour: "Space Black",
    colorHex: "#0f172a",
    condition: "Like New (Flawless)",
    conditionDescription: "Stunning Space Black finish with anodized seal to reduce fingerprints. Apple M3 Pro 11-core CPU / 14-core GPU. Liquid Retina XDR 120Hz ProMotion screen. Low battery cycle count.",
    batteryHealth: 99,
    price: 139999,
    originalMsp: 199900,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-21",
    stockTag: "CK-LAP-MBP14M3-991",
    screenSize: "14.2 inch Liquid Retina XDR",
    ram: "18GB Unified RAM",
    processor: "Apple M3 Pro (11-core CPU, 14-core GPU)",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Apple M3 Pro chip with hardware-accelerated ray tracing",
      "14.2-inch Liquid Retina XDR 120Hz (1000 nits sustained, 1600 peak)",
      "Space Black anodization with fingerprint-resistant coating",
      "MagSafe 3, 3x Thunderbolt 4 ports, HDMI, SDXC card slot",
      "Up to 18 hours battery backup with fast charging"
    ],
    inspectionPassed: [
      "Original Factory Apple Silicon Diagnostic: PASSED",
      "Liquid Retina XDR screen 100% flawless",
      "Magic Keyboard with Touch ID & Force Touch Trackpad verified",
      "Original Apple 70W USB-C Power Adapter + Braided MagSafe cable",
      "Cycle count under 25 cycles with 99% original health"
    ]
  },
  {
    id: "laptop-macbook-air-13-m2-256",
    category: "Laptops",
    brand: "Apple",
    model: "MacBook Air 13.6-inch (M2 Chip, 8GB / 256GB SSD)",
    storage: "256GB",
    colour: "Midnight",
    colorHex: "#1e293b",
    condition: "Like New (Flawless)",
    conditionDescription: "Ultra-slim 11.3mm fanless silent design. 13.6-inch Liquid Retina display with 500 nits brightness, MagSafe 3 charging, 1080p FaceTime HD camera, 18-hour battery.",
    batteryHealth: 96,
    price: 64999,
    originalMsp: 99900,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-20",
    stockTag: "CK-LAP-MBA13M2-961",
    screenSize: "13.6 inch Liquid Retina",
    ram: "8GB Unified RAM",
    processor: "Apple M2 (8-core CPU, 8-core GPU)",
    images: [
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Apple M2 next-gen silicon with fanless silent operation",
      "13.6-inch Liquid Retina with 1 billion colors support",
      "Dedicated MagSafe 3 charging port + 2x Thunderbolt ports",
      "Spatial Audio four-speaker sound system"
    ],
    inspectionPassed: [
      "Battery health 96% with low cycle count",
      "Liquid Retina screen crystal clear with TrueTone active",
      "Touch ID instantaneous fingerprint scan passed",
      "Original MagSafe 30W Power Adapter included"
    ]
  },
  {
    id: "laptop-dell-xps-15-9530",
    category: "Laptops",
    brand: "Dell",
    model: "Dell XPS 15 9530 (Core i7-13700H / 32GB RAM / 1TB SSD / RTX 4060)",
    storage: "1TB",
    colour: "Platinum Silver / Black Carbon Fiber",
    colorHex: "#64748b",
    condition: "Excellent (9.5/10)",
    conditionDescription: "Creator & engineering beast! 3.5K OLED InfinityEdge touch screen, CNC machined aluminum chassis with aerospace carbon fiber palm rest. Dedicated NVIDIA RTX 4060 8GB GPU.",
    batteryHealth: 94,
    price: 114999,
    originalMsp: 219e3,
    priceDrop: true,
    featured: false,
    status: "Available",
    dateAdded: "2026-08-19",
    stockTag: "CK-LAP-XPS15-941",
    screenSize: "15.6 inch 3.5K (3456x2160) OLED Touch",
    ram: "32GB DDR5 Dual-Channel",
    processor: "Intel Core i7-13700H (14-Core) + RTX 4060 8GB",
    images: [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "15.6-inch 3.5K OLED InfinityEdge 100% DCI-P3 touch screen",
      "Intel 13th Gen i7-13700H 14 Cores / 20 Threads",
      "NVIDIA GeForce RTX 4060 8GB GDDR6 dedicated graphics",
      "86Wh large battery with 130W Type-C adapter"
    ],
    inspectionPassed: [
      "OLED panel zero burn-in or color tinting",
      "Dual high-speed cooling fans dust cleaned & repasted",
      "Dell Hardware Diagnostics Passed 100%",
      "Windows 11 Pro genuine digital license activated"
    ]
  },
  // ==========================================
  // ACCESSORIES
  // ==========================================
  {
    id: "acc-apple-20w-charger-orig",
    category: "Accessories",
    brand: "Apple",
    model: "Apple 20W USB-C Power Adapter (Original)",
    storage: "N/A",
    colour: "White",
    colorHex: "#f8fafc",
    condition: "Like New (Flawless)",
    conditionDescription: "100% Genuine original Apple 20W Power Delivery adapter. Delivers fast charging up to 50% battery in 30 minutes for iPhone 12/13/14/15/16 and iPads.",
    price: 1299,
    originalMsp: 1900,
    priceDrop: true,
    featured: false,
    status: "Available",
    dateAdded: "2026-08-21",
    stockTag: "CK-ACC-20W-01",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: true,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: false
    },
    keyFeatures: [
      "Genuine Apple OEM internal circuitry with over-voltage safety",
      "20W Power Delivery 3.0 protocol",
      "Universal compatibility with all Type-C fast charging devices"
    ],
    inspectionPassed: [
      "Original Apple serial number verified",
      "Tested on digital multimeter power bench"
    ]
  },
  {
    id: "acc-magsafe-wireless-powerbank",
    category: "Accessories",
    brand: "Cortek Select",
    model: "10,000mAh MagSafe Magnetic Wireless Fast Power Bank",
    storage: "N/A",
    colour: "Titanium Gray",
    colorHex: "#64748b",
    condition: "Like New (Flawless)",
    conditionDescription: "Ultra-strong N52 magnetic snap-on battery pack with LED battery percentage display, 15W wireless output + 22.5W PD Type-C fast input/output.",
    price: 1599,
    originalMsp: 2999,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-20",
    stockTag: "CK-ACC-PB10K-02",
    images: [
      "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: false,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "10,000mAh high density Lithium Polymer cell",
      "15W MagSafe magnetic wireless charging",
      "22.5W wired Type-C PD two-way fast charge",
      "LED digital power display"
    ],
    inspectionPassed: [
      "Magnetic hold capacity tested on iPhone 15 Pro",
      "Battery charge/discharge cycle verified"
    ]
  },
  // ==========================================
  // OTHER GADGETS (AirPods, Audio, Gimbals)
  // ==========================================
  {
    id: "gadget-airpods-pro-2-usbc",
    category: "Other Gadgets",
    brand: "Apple",
    model: "AirPods Pro (2nd Generation, USB-C MagSafe Case)",
    storage: "N/A",
    colour: "White",
    colorHex: "#ffffff",
    condition: "Like New (Flawless)",
    conditionDescription: "Pro active noise cancellation (2x more effective), Adaptive Audio, Transparency mode, Personalized Spatial Audio. USB-C charging case with lanyard loop and Precision Finding speaker.",
    batteryHealth: 98,
    price: 15499,
    originalMsp: 24900,
    priceDrop: true,
    featured: true,
    status: "Available",
    dateAdded: "2026-08-21",
    stockTag: "CK-GDT-APP2-981",
    processor: "Apple H2 Headphone Chip",
    images: [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: false,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "Apple H2 chip with 2x Active Noise Cancellation",
      "USB-C MagSafe case with Precision Finding (U1 chip) & speaker",
      "Adaptive Audio & Conversation Awareness",
      "Touch volume swipe control on stem",
      "IP54 dust, sweat, and water resistance"
    ],
    inspectionPassed: [
      "Original Apple serial number verified in iOS Settings",
      "Active Noise Cancellation & Transparency tested",
      "Left & Right audio drivers clean without distortion",
      "Original ear tips sanitized + replacement sizes included"
    ]
  },
  {
    id: "gadget-dji-osmo-mobile-6",
    category: "Other Gadgets",
    brand: "DJI",
    model: "DJI Osmo Mobile 6 (OM6) 3-Axis Smartphone Gimbal",
    storage: "N/A",
    colour: "Slate Gray",
    colorHex: "#475569",
    condition: "Like New (Flawless)",
    conditionDescription: "Portable 3-axis motorized stabilizer with built-in extension rod for selfies & low angles, ActiveTrack 6.0 subject tracking, magnetic quick-release phone clamp.",
    batteryHealth: 99,
    price: 8499,
    originalMsp: 13990,
    priceDrop: true,
    featured: false,
    status: "Available",
    dateAdded: "2026-08-19",
    stockTag: "CK-GDT-DJIOM6-991",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
    ],
    inBox: {
      chargerIncluded: false,
      originalBox: true,
      taxInvoiceProvided: true,
      cableIncluded: true
    },
    keyFeatures: [
      "3-Axis Motorized Stabilization with brushless gimbal motors",
      "Built-in 215mm extension selfie rod",
      "ActiveTrack 6.0 smart subject auto-tracking",
      "Quick Launch & DJI Mimo camera app integration"
    ],
    inspectionPassed: [
      "All 3 motorized axes calibrated & balanced",
      "Magnetic phone clamp grip strength verified",
      "Built-in extension rod smooth sliding",
      "Battery holding full runtime tested"
    ]
  }
];

// api/[[path]].ts
var DEMO_USERS = {
  "admin@demo.cortek.in": { id: "demo-admin", role: "admin", name: "Demo Admin" },
  "sales@demo.cortek.in": { id: "demo-sales", role: "sales", name: "Demo Sales" }
};
var uuid = /* @__PURE__ */ __name(() => crypto.randomUUID(), "uuid");
var isoNow = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "isoNow");
var json = /* @__PURE__ */ __name((data, status = 200) => Response.json(data, { status }), "json");
function statusToApi(status) {
  if (status === "Booked") return "reserved";
  if (status === "Sold Out") return "sold";
  if (status === "Retired") return "retired";
  return "available";
}
__name(statusToApi, "statusToApi");
function makeInitialState() {
  const now = isoNow();
  return {
    products: SEED_PHONES.map((phone) => {
      const unitId = uuid();
      const grade = {
        "Like New (Flawless)": "A+",
        "Excellent (9.5/10)": "A",
        "Very Good (8.5/10)": "B",
        "Good (Minor Marks)": "C"
      }[phone.condition] || phone.condition;
      return {
        id: phone.id,
        category: phone.category || "Phones",
        brand: phone.brand,
        model: phone.model,
        storage: phone.storage,
        colour: phone.colour,
        colorHex: phone.colorHex || null,
        conditionGrade: grade,
        conditionDescription: phone.conditionDescription,
        batteryHealth: phone.batteryHealth ?? null,
        priceInr: phone.price,
        originalMsp: phone.originalMsp ?? null,
        billAvailable: phone.billAvailable ?? true,
        billAmount: phone.billAmount ?? null,
        priceDrop: phone.priceDrop ?? false,
        featured: phone.featured ?? false,
        stockTag: phone.stockTag || `DEMO-${phone.id}`,
        screenSize: phone.screenSize || null,
        ram: phone.ram || null,
        processor: phone.processor || null,
        inBox: phone.inBox,
        keyFeatures: phone.keyFeatures || [],
        images: phone.images.map((url, index) => ({
          url,
          altText: `${phone.brand} ${phone.model}`,
          sortOrder: index,
          isPrimary: index === 0
        })),
        units: [{
          id: unitId,
          productId: phone.id,
          stockTag: phone.stockTag || `DEMO-${phone.id}`,
          status: statusToApi(phone.status),
          salePriceInr: phone.price,
          createdAt: now,
          updatedAt: now
        }],
        dateAdded: phone.dateAdded,
        createdAt: now,
        updatedAt: now
      };
    }),
    reservations: [],
    sales: [],
    customers: []
  };
}
__name(makeInitialState, "makeInitialState");
async function readState(db) {
  const stored = await db.prepare("SELECT revision, value FROM demo_state WHERE id = 1").first();
  if (stored) return stored;
  const initial = JSON.stringify(makeInitialState());
  await db.prepare("INSERT OR IGNORE INTO demo_state (id, revision, value) VALUES (1, 0, ?)").bind(initial).run();
  const created = await db.prepare("SELECT revision, value FROM demo_state WHERE id = 1").first();
  if (!created) throw new Error("Unable to initialize the demo database.");
  return created;
}
__name(readState, "readState");
async function saveState(db, current, state) {
  const result = await db.prepare(
    "UPDATE demo_state SET revision = revision + 1, value = ? WHERE id = 1 AND revision = ?"
  ).bind(JSON.stringify(state), current.revision).run();
  return (result.meta.changes || 0) === 1;
}
__name(saveState, "saveState");
function authUser(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const [prefix, role, expires] = token.split(".");
  if (prefix !== "demo" || !["admin", "sales"].includes(role) || Number(expires) < Date.now()) return null;
  return role === "admin" ? DEMO_USERS["admin@demo.cortek.in"] : DEMO_USERS["sales@demo.cortek.in"];
}
__name(authUser, "authUser");
function normalizeProduct(input, old) {
  const now = isoNow();
  const id = old?.id || uuid();
  const stockTag = String(input.stockTag || old?.stockTag || `CK-${Date.now().toString(36).toUpperCase()}`);
  const unit = old?.units?.[0] || {
    id: uuid(),
    productId: id,
    stockTag: `${stockTag}-U1`,
    status: "available",
    salePriceInr: Number(input.priceInr || 0),
    createdAt: now,
    updatedAt: now
  };
  const images = Array.isArray(input.images) ? input.images : old?.images || [];
  return {
    id,
    category: String(input.category || old?.category || "Phones"),
    brand: String(input.brand ?? old?.brand ?? ""),
    model: String(input.model ?? old?.model ?? ""),
    storage: String(input.storage ?? old?.storage ?? "N/A"),
    colour: String(input.colour ?? old?.colour ?? ""),
    colorHex: input.colorHex === void 0 ? old?.colorHex || null : String(input.colorHex || "") || null,
    conditionGrade: String(input.conditionGrade ?? old?.conditionGrade ?? "A+"),
    conditionDescription: String(input.conditionDescription ?? old?.conditionDescription ?? ""),
    batteryHealth: input.batteryHealth == null ? old?.batteryHealth ?? null : Number(input.batteryHealth),
    priceInr: Number(input.priceInr ?? old?.priceInr ?? 0),
    originalMsp: input.originalMsp == null ? old?.originalMsp ?? null : Number(input.originalMsp),
    billAvailable: Boolean(input.billAvailable ?? old?.billAvailable ?? false),
    billAmount: input.billAmount == null ? old?.billAmount ?? null : Number(input.billAmount),
    priceDrop: Boolean(input.priceDrop ?? old?.priceDrop ?? false),
    featured: Boolean(input.featured ?? old?.featured ?? false),
    stockTag,
    screenSize: input.screenSize == null ? old?.screenSize ?? null : String(input.screenSize),
    ram: input.ram == null ? old?.ram ?? null : String(input.ram),
    processor: input.processor == null ? old?.processor ?? null : String(input.processor),
    inBox: input.inBox || old?.inBox || {},
    keyFeatures: Array.isArray(input.keyFeatures) ? input.keyFeatures : old?.keyFeatures || [],
    images,
    units: [{ ...unit, salePriceInr: Number(input.priceInr ?? old?.priceInr ?? unit.salePriceInr ?? 0), updatedAt: now }],
    dateAdded: old?.dateAdded || now.slice(0, 10),
    createdAt: old?.createdAt || now,
    updatedAt: now
  };
}
__name(normalizeProduct, "normalizeProduct");
function productMatches(product, query) {
  const unit = product.units[0];
  const search = query.get("search")?.toLowerCase();
  return (!query.has("category") || product.category === query.get("category")) && (!query.has("brand") || product.brand === query.get("brand")) && (!query.has("storage") || product.storage === query.get("storage")) && (!query.has("condition") || product.conditionGrade === query.get("condition")) && (!query.has("minPrice") || product.priceInr >= Number(query.get("minPrice"))) && (!query.has("maxPrice") || product.priceInr <= Number(query.get("maxPrice"))) && (!query.has("minBatteryHealth") || (product.batteryHealth || 0) >= Number(query.get("minBatteryHealth"))) && (!query.has("featured") || product.featured === (query.get("featured") === "true")) && (!query.has("priceDrop") || product.priceDrop === (query.get("priceDrop") === "true")) && (query.get("availableOnly") !== "true" || unit?.status === "available") && (!search || [product.brand, product.model, product.stockTag, product.colour].some((value) => value.toLowerCase().includes(search)));
}
__name(productMatches, "productMatches");
async function onRequest(context2) {
  const { request, env: env2 } = context2;
  if (!env2.DB) return json({ error: "Demo database is not configured. Bind a Cloudflare D1 database as DB." }, 503);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();
  try {
    if (path === "/health" && method === "GET") {
      await env2.DB.prepare("SELECT 1").first();
      return json({ status: "ok", mode: "demo", database: "connected", imageStorage: "inline-demo-only" });
    }
    if (path === "/auth/login" && method === "POST") {
      const body = await request.json();
      const email = body.email?.toLowerCase();
      const user2 = email ? DEMO_USERS[email] : void 0;
      if (!user2 || body.password !== "Demo1234!") return json({ error: "Invalid demo credentials." }, 401);
      return json({
        token: `demo.${user2.role}.${Date.now() + 8 * 60 * 60 * 1e3}`,
        user: { id: user2.id, email, role: user2.role, name: user2.name }
      });
    }
    const user = authUser(request);
    if (path === "/auth/me" && method === "GET") {
      if (!user) return json({ error: "Authentication required." }, 401);
      return json({ ...user, email: user.role === "admin" ? "admin@demo.cortek.in" : "sales@demo.cortek.in" });
    }
    if (path.startsWith("/auth/") && method !== "GET") {
      if (!user) return json({ error: "Authentication required." }, 401);
      return json({ error: "User management is disabled in demo mode." }, 403);
    }
    let stateRow;
    let state;
    const load = /* @__PURE__ */ __name(async () => {
      if (!stateRow || !state) {
        stateRow = await readState(env2.DB);
        state = JSON.parse(stateRow.value);
      }
      return state;
    }, "load");
    const persist = /* @__PURE__ */ __name(async () => {
      if (!stateRow || !state) {
        return json({ error: "Demo state is unavailable. Please retry." }, 500);
      }
      if (new TextEncoder().encode(JSON.stringify(state)).byteLength > 900 * 1024) {
        return json({ error: "Demo database is nearly full. Configure R2 for image uploads or reset the demo data." }, 413);
      }
      if (!await saveState(env2.DB, stateRow, state)) {
        return json({ error: "Demo data changed in another request. Please retry." }, 409);
      }
      return null;
    }, "persist");
    const requireStaff = /* @__PURE__ */ __name(() => user ? null : json({ error: "Authentication required." }, 401), "requireStaff");
    const requireAdmin = /* @__PURE__ */ __name(() => !user ? json({ error: "Authentication required." }, 401) : user.role !== "admin" ? json({ error: "Admin access required." }, 403) : null, "requireAdmin");
    if (path === "/products" && method === "GET") {
      const data = await load();
      const products = data.products.filter((product) => productMatches(product, url.searchParams));
      const page = Math.max(1, Number(url.searchParams.get("page") || 1));
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 100)));
      const sort = url.searchParams.get("sort");
      if (sort === "price-asc") products.sort((a, b) => a.priceInr - b.priceInr);
      if (sort === "price-desc") products.sort((a, b) => b.priceInr - a.priceInr);
      if (sort === "battery-desc") products.sort((a, b) => (b.batteryHealth || 0) - (a.batteryHealth || 0));
      if (!sort || sort === "featured") products.sort((a, b) => Number(b.featured) - Number(a.featured));
      const total = products.length;
      return json({ products: products.slice((page - 1) * limit, page * limit), total, page, limit, pages: Math.ceil(total / limit) });
    }
    const productDetail = path.match(/^\/products\/([^/]+)$/);
    if (productDetail && method === "GET") {
      const product = (await load()).products.find((item) => item.id === productDetail[1]);
      return product ? json(product) : json({ error: "Product not found." }, 404);
    }
    const productInventory = path.match(/^\/products\/([^/]+)\/inventory$/);
    if (productInventory && method === "GET") {
      const product = (await load()).products.find((item) => item.id === productInventory[1]);
      return product ? json(product.units) : json({ error: "Product not found." }, 404);
    }
    if (path === "/products" && method === "POST") {
      const denied = requireStaff();
      if (denied) return denied;
      const body = await request.json();
      const data = await load();
      const product = normalizeProduct(body);
      data.products.unshift(product);
      const conflict = await persist();
      return conflict || json(product, 201);
    }
    if (productDetail && method === "PATCH") {
      const denied = requireStaff();
      if (denied) return denied;
      const data = await load();
      const index = data.products.findIndex((item) => item.id === productDetail[1]);
      if (index < 0) return json({ error: "Product not found." }, 404);
      data.products[index] = normalizeProduct(await request.json(), data.products[index]);
      const conflict = await persist();
      return conflict || json({ message: "Product updated." });
    }
    if (productDetail && method === "DELETE") {
      const denied = requireAdmin();
      if (denied) return denied;
      const data = await load();
      const product = data.products.find((item) => item.id === productDetail[1]);
      if (product?.units.some((unit) => data.sales.some((sale) => sale.inventoryUnitId === unit.id))) {
        return json({ error: "Sold products cannot be deleted." }, 409);
      }
      data.products = data.products.filter((item) => item.id !== productDetail[1]);
      const conflict = await persist();
      return conflict || json({ message: "Product deleted." });
    }
    if (path === "/inventory" && method === "GET") {
      const denied = requireStaff();
      if (denied) return denied;
      const data = await load();
      const status = url.searchParams.get("status");
      const productId = url.searchParams.get("productId");
      return json(data.products.flatMap((product) => product.units.filter((unit) => (!status || unit.status === status) && (!productId || product.id === productId)).map((unit) => ({
        ...unit,
        brand: product.brand,
        model: product.model,
        storage: product.storage,
        colour: product.colour,
        priceInr: product.priceInr,
        productStockTag: product.stockTag
      }))));
    }
    const inventoryStatus = path.match(/^\/inventory\/([^/]+)\/status$/);
    if (inventoryStatus && method === "PATCH") {
      const denied = requireAdmin();
      if (denied) return denied;
      const body = await request.json();
      if (!["available", "reserved", "sold", "retired"].includes(body.status || "")) {
        return json({ error: "Invalid inventory status." }, 400);
      }
      const data = await load();
      const unit = data.products.flatMap((product) => product.units).find((item) => item.id === inventoryStatus[1]);
      if (!unit) return json({ error: "Inventory unit not found." }, 404);
      const validTransitions = {
        available: ["reserved", "sold", "retired"],
        reserved: ["available", "sold"],
        sold: ["available"],
        retired: ["available"]
      };
      if (unit.status !== body.status && !validTransitions[unit.status].includes(body.status)) {
        return json({ error: `Invalid inventory transition: ${unit.status} -> ${body.status}.` }, 400);
      }
      if (unit.status === "sold" && body.status === "available") {
        data.sales = data.sales.filter((sale) => sale.inventoryUnitId !== unit.id);
        data.reservations = data.reservations.map(
          (reservation) => reservation.inventoryUnitId === unit.id && reservation.status === "converted" ? { ...reservation, status: "cancelled" } : reservation
        );
      }
      unit.status = body.status;
      const conflict = await persist();
      return conflict || json({ id: unit.id, status: unit.status });
    }
    const inventoryUnit = path.match(/^\/inventory\/([^/]+)$/);
    if (inventoryUnit && method === "DELETE") {
      const denied = requireAdmin();
      if (denied) return denied;
      const data = await load();
      const product = data.products.find((item) => item.units.some((unit) => unit.id === inventoryUnit[1]));
      if (!product) return json({ error: "Inventory unit not found." }, 404);
      if (data.sales.some((sale) => sale.inventoryUnitId === inventoryUnit[1])) {
        return json({ error: "Sold stock cannot be deleted." }, 409);
      }
      product.units = product.units.filter((unit) => unit.id !== inventoryUnit[1]);
      if (product.units.length === 0) data.products = data.products.filter((item) => item.id !== product.id);
      const conflict = await persist();
      return conflict || json({ message: "Inventory unit deleted.", id: inventoryUnit[1] });
    }
    if (path === "/reservations" && method === "GET") {
      const denied = requireStaff();
      if (denied) return denied;
      const data = await load();
      const status = url.searchParams.get("status");
      return json(data.reservations.filter((item) => !status || item.status === status));
    }
    if (path === "/reservations" && method === "POST") {
      const denied = requireStaff();
      if (denied) return denied;
      const body = await request.json();
      const data = await load();
      const product = data.products.find((item) => item.units.some((unit2) => unit2.id === body.inventoryUnitId));
      const unit = product?.units.find((item) => item.id === body.inventoryUnitId);
      if (!product || !unit) return json({ error: "Inventory unit not found." }, 404);
      if (unit.status !== "available") return json({ error: "Unit is not available for reservation." }, 409);
      const now = isoNow();
      const customerId = uuid();
      const expiresAt = new Date(Date.now() + (body.durationMinutes || 120) * 6e4).toISOString();
      unit.status = "reserved";
      data.customers.push({ id: customerId, name: body.customerName || "Walk-in", phone: body.customerPhone || "0000000000", email: null, notes: "", createdAt: now });
      const reservation = {
        id: uuid(),
        inventoryUnitId: unit.id,
        customerId,
        customerName: body.customerName || "Walk-in",
        customerPhone: body.customerPhone || "",
        stockTag: unit.stockTag,
        brand: product.brand,
        model: product.model,
        storage: product.storage,
        status: "active",
        expiresAt,
        notes: null,
        createdAt: now
      };
      data.reservations.unshift(reservation);
      const conflict = await persist();
      return conflict || json(reservation, 201);
    }
    if (path === "/reservations/cancel" && method === "POST") {
      const denied = requireStaff();
      if (denied) return denied;
      const body = await request.json();
      const data = await load();
      const reservation = data.reservations.find((item) => item.id === body.reservationId);
      if (!reservation) return json({ error: "Reservation not found." }, 404);
      if (reservation.status !== "active" && reservation.status !== "pending") return json({ error: "Reservation already closed." }, 400);
      reservation.status = "cancelled";
      for (const product of data.products) {
        const unit = product.units.find((item) => item.id === reservation.inventoryUnitId);
        if (unit) unit.status = "available";
      }
      const conflict = await persist();
      return conflict || json({ message: "Reservation cancelled." });
    }
    if (path === "/sales" && method === "GET") {
      const denied = requireStaff();
      if (denied) return denied;
      return json((await load()).sales);
    }
    if (path === "/sales" && method === "POST") {
      const denied = requireStaff();
      if (denied) return denied;
      const body = await request.json();
      const data = await load();
      const product = data.products.find((item) => item.units.some((unit2) => unit2.id === body.inventoryUnitId));
      const unit = product?.units.find((item) => item.id === body.inventoryUnitId);
      if (!product || !unit) return json({ error: "Inventory unit not found." }, 404);
      if (unit.status === "sold") return json({ error: "This unit has already been sold." }, 409);
      if (unit.status === "reserved") {
        const reservation = data.reservations.find(
          (item) => item.id === body.reservationId && item.inventoryUnitId === unit.id && ["pending", "active"].includes(item.status)
        );
        if (!reservation) return json({ error: "Reservation ID required for reserved units." }, 400);
        reservation.status = "converted";
      }
      if (unit.status === "retired") return json({ error: "This unit is no longer available." }, 400);
      const now = isoNow();
      unit.status = "sold";
      unit.salePriceInr = body.salePriceInr;
      const customerPhone = body.customerPhone || "";
      if (customerPhone && !data.customers.some((customer) => customer.phone === customerPhone)) {
        data.customers.push({
          id: uuid(),
          name: body.customerName || "Walk-in",
          phone: customerPhone,
          email: null,
          notes: "",
          createdAt: now
        });
      }
      const sale = {
        id: uuid(),
        inventoryUnitId: unit.id,
        customerName: body.customerName || "Walk-in",
        customerPhone,
        sellerName: user.name,
        brand: product.brand,
        model: product.model,
        storage: product.storage,
        colour: product.colour,
        stockTag: unit.stockTag,
        salePriceInr: body.salePriceInr,
        discountInr: body.discountInr || 0,
        notes: null,
        soldAt: now
      };
      data.sales.unshift(sale);
      const conflict = await persist();
      return conflict || json({ id: sale.id, inventoryUnitId: sale.inventoryUnitId, salePriceInr: sale.salePriceInr, soldAt: sale.soldAt }, 201);
    }
    if (path === "/sales/metrics" && method === "GET") {
      const denied = requireAdmin();
      if (denied) return denied;
      const data = await load();
      const units = data.products.flatMap((product) => product.units);
      const available = units.filter((unit) => unit.status === "available");
      const sold = units.filter((unit) => unit.status === "sold");
      return json({
        totalProducts: data.products.length,
        availableUnits: available.length,
        reservedUnits: units.filter((unit) => unit.status === "reserved").length,
        soldUnits: sold.length,
        totalStockValue: available.reduce((sum, unit) => sum + (unit.salePriceInr || 0), 0),
        totalRevenue: sold.reduce((sum, unit) => sum + (unit.salePriceInr || 0), 0),
        avgUnitPrice: available.length ? Math.round(available.reduce((sum, unit) => sum + (unit.salePriceInr || 0), 0) / available.length) : 0
      });
    }
    if (path === "/uploads/image" && method === "POST") {
      const denied = requireStaff();
      if (denied) return denied;
      const form = await request.formData();
      const file = form.get("image");
      if (!(file instanceof File)) return json({ error: "No image file provided." }, 400);
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        return json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed." }, 400);
      }
      if (env2.R2) {
        if (file.size > 5 * 1024 * 1024) return json({ error: "File too large. Maximum 5MB." }, 400);
        const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
        const filename = `${crypto.randomUUID()}.${extension}`;
        await env2.R2.put(filename, file.stream(), { httpMetadata: { contentType: file.type } });
        return json({ url: `/api/uploads/file/${filename}`, filename, size: file.size });
      }
      if (file.size > 60 * 1024) return json({ error: "Demo uploads are limited to 60KB until R2 is configured." }, 400);
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const dataUrl = `data:${file.type};base64,${btoa(binary)}`;
      return json({ url: dataUrl, filename: `demo-${crypto.randomUUID()}`, size: file.size });
    }
    const uploadedFile = path.match(/^\/uploads\/file\/([a-zA-Z0-9-]+\.(?:jpg|png|webp|gif))$/);
    if (uploadedFile && method === "GET") {
      if (!env2.R2) return json({ error: "Image is not available without the R2 binding." }, 404);
      const object = await env2.R2.get(uploadedFile[1]);
      if (!object) return json({ error: "File not found." }, 404);
      return new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
    if (path === "/customers" && method === "GET") {
      const denied = requireStaff();
      if (denied) return denied;
      return json((await load()).customers);
    }
    if (path === "/inspections" && method === "GET") {
      const denied = requireStaff();
      if (denied) return denied;
      return json([]);
    }
    if (path === "/inspections" && method === "POST") {
      const denied = requireStaff();
      if (denied) return denied;
      return json({ error: "Inspection entry is not enabled in demo mode." }, 501);
    }
    const uploadedFileToDelete = path.match(/^\/uploads\/([a-zA-Z0-9-]+(?:\.(?:jpg|png|webp|gif))?)$/);
    if (uploadedFileToDelete && method === "DELETE") {
      const denied = requireAdmin();
      if (denied) return denied;
      if (env2.R2) await env2.R2.delete(uploadedFileToDelete[1]);
      return json({ message: "Image deleted." });
    }
    return json({ error: "Not found." }, 404);
  } catch (error3) {
    console.error("Cloudflare demo API error:", error3);
    return json({ error: "Demo API request failed. Please retry." }, 500);
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-QU8mbN/functionsRoutes-0.12380960178827138.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
