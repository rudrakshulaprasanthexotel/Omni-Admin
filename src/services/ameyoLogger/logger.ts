import AmeyoLogger, { type ILogLevel } from 'js-logger';

AmeyoLogger.useDefaults();
// Default to INFO level to prevent console spam and DevTools performance issues
// Set to DEBUG only when needed: localStorage.setItem('AMEYO_LOG_LEVEL', 'DEBUG')
const getLogLevel = () => {
	if (typeof window !== 'undefined') {
		const levelOverride = localStorage.getItem('AMEYO_LOG_LEVEL');
		if (levelOverride === 'DEBUG') return AmeyoLogger.DEBUG;
		if (levelOverride === 'INFO') return AmeyoLogger.INFO;
		if (levelOverride === 'WARN') return AmeyoLogger.WARN;
		if (levelOverride === 'ERROR') return AmeyoLogger.ERROR;
	}
	// Default to WARN in production, INFO in development
	return import.meta.env.MODE === 'development' ? AmeyoLogger.INFO : AmeyoLogger.WARN;
};
AmeyoLogger.setLevel(getLogLevel());
// every time log is used this handler will get executed
AmeyoLogger.setHandler(function (messages, context) {
	consoleHandler(messages, context);

	//myHandler(messages, context);
});

//logging in console as well as saving log in localstorage
// always log page url also
const consoleHandler = AmeyoLogger.createDefaultHandler({
	formatter: function (messages, context) {
		// prefix each log message with a timestamp.
		var prefix = '';
		if (context.name) {
			prefix = '[' + context.name + ']' + ' ';
		}
		let date = new Date();
		let key = createKeyToLog(date);
		let messageToLog = createMessageToLog(prefix, messages[0], date, context.level.name, key);
		localStorageLog(key, messageToLog);

		messages.unshift(prefix + formatDate(date));
	}
});

// Client-side log storage: FIFO queue with bounded count/size
// Defaults are used until the diagnostics config is loaded from the server.
// Once loaded, getDiagLoggerConfig() returns live values from Redux state.
let _diagConfigGetter: (() => { clientLogEnabled: boolean; logLevel: string; logStorageMaxBytes: number; logStorageMaxCount: number }) | null = null;

/**
 * Called once after login to wire the diagnostics config into the logger.
 * Must be lazy to avoid circular dependency: logger -> store -> slices -> logger.
 */
export function initLoggerDiagnostics(getter: typeof _diagConfigGetter): void {
	_diagConfigGetter = getter;
	if (getter) {
		const cfg = getter();
		console.log('[AmeyoLogger] Diagnostics config loaded:', cfg);
		const levelMap: Record<string, any> = { DEBUG: AmeyoLogger.DEBUG, INFO: AmeyoLogger.INFO, WARN: AmeyoLogger.WARN, ERROR: AmeyoLogger.ERROR };
		if (cfg.logLevel && levelMap[cfg.logLevel]) {
			AmeyoLogger.setLevel(levelMap[cfg.logLevel]);
		}
	}
}

function getDiagLoggerConfig() {
	if (_diagConfigGetter) {
		try { return _diagConfigGetter(); } catch { /* fall through */ }
	}
	return null;
}

const isClientLogEnabled = true;
var MAX_RANDOM_INT = Math.pow(2, 32);
const AMEYO_REMOTE_LOGGING_PREFIX = 'RLog: ';
const RLOG_MANIFEST_KEY = 'RLog:__queue__';

/** Max bytes for RLog entries. Configurable via localStorage:
 *  - AMEYO_LOG_STORAGE_MAX_BYTES (e.g. "2097152")
 *  - AMEYO_LOG_STORAGE_MAX_MB (e.g. "2")
 * Default: 2MB */
const DEFAULT_LOG_STORAGE_MAX_BYTES = 2 * 1024 * 1024;

/** Max count of RLog entries (FIFO queue capacity). Configurable via localStorage:
 *  - AMEYO_LOG_STORAGE_MAX_COUNT (e.g. "100", "500", "1000")
 * Default: 1000. Set to "0" to disable count limit. */
const DEFAULT_LOG_STORAGE_MAX_COUNT = 1000;

function getLogStorageMaxBytes(): number {
	const diag = getDiagLoggerConfig();
	if (diag?.logStorageMaxBytes && diag.logStorageMaxBytes > 0) return diag.logStorageMaxBytes;

	if (typeof window === 'undefined') return DEFAULT_LOG_STORAGE_MAX_BYTES;
	const bytes = localStorage.getItem('AMEYO_LOG_STORAGE_MAX_BYTES');
	if (bytes) return parseInt(bytes, 10) || DEFAULT_LOG_STORAGE_MAX_BYTES;
	const mb = localStorage.getItem('AMEYO_LOG_STORAGE_MAX_MB');
	if (mb) return (parseInt(mb, 10) || 2) * 1024 * 1024;
	return DEFAULT_LOG_STORAGE_MAX_BYTES;
}

function getLogStorageMaxCount(): number | null {
	const diag = getDiagLoggerConfig();
	if (diag?.logStorageMaxCount !== undefined && diag.logStorageMaxCount > 0) return diag.logStorageMaxCount;

	if (typeof window === 'undefined') return DEFAULT_LOG_STORAGE_MAX_COUNT;
	const count = localStorage.getItem('AMEYO_LOG_STORAGE_MAX_COUNT');
	if (count === null || count === '') return DEFAULT_LOG_STORAGE_MAX_COUNT;
	const n = parseInt(count, 10);
	return n <= 0 ? null : n;
}

function getByteSize(str: string): number {
	return new Blob([str]).size;
}

/** FIFO queue manifest: ordered keys + sizes for O(1) eviction without localStorage reads */
interface LogQueueManifest {
	keys: string[];
	/** Per-key size (key bytes + value bytes). Same order as keys. */
	sizes: number[];
	totalSize: number;
}

function getQueueManifest(): LogQueueManifest {
	try {
		const raw = localStorage.getItem(RLOG_MANIFEST_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as LogQueueManifest;
			if (Array.isArray(parsed?.keys) && typeof parsed?.totalSize === 'number') {
				if (Array.isArray(parsed.sizes) && parsed.keys.length === parsed.sizes.length) {
					return parsed;
				}
				// Migrate old manifest: rebuild sizes from localStorage (one-time cost)
				const sizes: number[] = [];
				let total = 0;
				for (const k of parsed.keys) {
					const v = localStorage.getItem(k) || '';
					const sz = getByteSize(k) + getByteSize(v);
					sizes.push(sz);
					total += sz;
				}
				const migrated = { keys: parsed.keys, sizes, totalSize: total };
				saveQueueManifest(migrated);
				return migrated;
			}
		}
	} catch {
		// Corrupted manifest, start fresh
	}
	return { keys: [], sizes: [], totalSize: 0 };
}

function saveQueueManifest(manifest: LogQueueManifest): void {
	localStorage.setItem(RLOG_MANIFEST_KEY, JSON.stringify(manifest));
}

/** Evict oldest entries from queue until within limits (FIFO). Uses manifest sizes only (no getItem/getByteSize in loop). */
function evictFromQueue(
	manifest: LogQueueManifest,
	maxBytes: number,
	maxCount: number | null
): LogQueueManifest {
	const { keys, sizes, totalSize } = manifest;
	let size = totalSize;
	const newKeys: string[] = [];
	const newSizes: number[] = [];

	for (let i = 0; i < keys.length; i++) {
		const overCount = maxCount !== null && newKeys.length + (keys.length - i) >= maxCount;
		const overSize = size >= maxBytes;
		if (!overCount && !overSize) {
			newKeys.push(keys[i]);
			newSizes.push(sizes[i]);
			continue;
		}
		size -= sizes[i];
		localStorage.removeItem(keys[i]);
	}

	return { keys: newKeys, sizes: newSizes, totalSize: size };
}

/** Clear all RLog entries (queue + manifest). Preserves auth, redux-persist. */
function clearRLogEntriesOnly(): void {
	if (!localStorage) return;
	const manifest = getQueueManifest();
	for (const k of manifest.keys) localStorage.removeItem(k);
	localStorage.removeItem(RLOG_MANIFEST_KEY);
	// Fallback: remove any orphaned RLog keys (e.g. from old format)
	for (let i = localStorage.length - 1; i >= 0; i--) {
		const k = localStorage.key(i);
		if (k?.startsWith(AMEYO_REMOTE_LOGGING_PREFIX)) localStorage.removeItem(k);
	}
}

function createMessageToLog(prefix: string, message: any, logTime: Date, level: ILogLevel['name'], key: string) {
	var messageToLog = message + '';
	if (message.stack !== undefined) {
		messageToLog = messageToLog + ' ' + message.stack;
	}
	// will add this
	var sessionId = '';
	let ameyoClient: any;
	if (ameyoClient) {
		sessionId = ameyoClient.sessionId;
	}
	messageToLog =
		prefix + '[' + formatDate(logTime) + '] ' + level + ' [' + sessionId + '] ' + ' [' + key + '] ' + messageToLog;

	return messageToLog;
}
export function formatDate(date: Date) {
	let dformat =
		[date.getFullYear(), ('0' + (date.getMonth() + 1)).slice(-2), ('0' + date.getDate()).slice(-2)].join('-') +
		' ' +
		[
			('0' + date.getHours()).slice(-2),
			('0' + date.getMinutes()).slice(-2),
			('0' + date.getSeconds()).slice(-2),	
			('0' + date.getMilliseconds()).slice(-3)
		].join(':');
	return dformat;
}

function createKeyToLog(logTime: Date) {
	return AMEYO_REMOTE_LOGGING_PREFIX + logTime.getTime() + '-' + Math.floor(Math.random() * MAX_RANDOM_INT + 1);
}

//var consoleHandler = Logger.createDefaultHandler();

function localStorageLog(key: string, messageToLog: any) {
	const diag = getDiagLoggerConfig();
	const enabled = diag?.clientLogEnabled ?? isClientLogEnabled;
	if (!enabled || !localStorage) return;
	try {
		const maxBytes = getLogStorageMaxBytes();
		const maxCount = getLogStorageMaxCount();
		const newEntrySize = getByteSize(key) + getByteSize(String(messageToLog));

		// FIFO queue: evict oldest until room for new entry
		let manifest = getQueueManifest();
		manifest = evictFromQueue(manifest, maxBytes - newEntrySize, maxCount);
		saveQueueManifest(manifest);

		localStorage.setItem(key, messageToLog);

		// Enqueue: add to manifest (key + size for cheap eviction later)
		manifest.keys.push(key);
		manifest.sizes.push(newEntrySize);
		manifest.totalSize += newEntrySize;
		saveQueueManifest(manifest);
	} catch (e) {
		// On QuotaExceededError: clear only RLog entries, preserve auth & redux-persist
		clearRLogEntriesOnly();
		console.info('RLog entries cleared due to storage quota');
	}
}

// Logger.sendData = function () {
//     console.log("sending data to server");

// }

//listen all uncaught error
window.onerror = function (message, source, lineno, colno, error) {
	AmeyoLogger.error(error);
	// Dynamic import to avoid circular dependency with ErrorReporterService -> store -> SendErrorLogSlice -> AmeyoLogger
	// import('@/app/services/errorReporter/ErrorReporterService').then(({ ErrorReporterService }) => {
	// 	ErrorReporterService.getInstance().report(
	// 		error || new Error(String(message)),
	// 		{ source: 'onerror', errorType: 'UNCAUGHT' }
	// 	);
	// }).catch(() => {});
};
export default AmeyoLogger;

// const AmeyoLogger = {
//   log: function log(msg: any) {
//     let prefix = "[AmeyoLogger] ";
//     console.log(prefix + msg);
//   }
// }

// export default AmeyoLogger;
