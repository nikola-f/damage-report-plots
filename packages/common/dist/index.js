(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading wasm modules
/******/ 	var installedWasmModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// object with all compiled WebAssembly.Modules
/******/ 	__webpack_require__.w = {};
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./handler.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./handler.ts":
/*!********************!*\
  !*** ./handler.ts ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n// export * from '../sub/types';\nfunction __export(m) {\n    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];\n}\nObject.defineProperty(exports, \"__esModule\", { value: true });\n// export * from '../sub/util';\n// export * from '../sub/launcher';\n// export * from '../sub/_queue';\n// export * from '../sub/_auth';\n// export * from '../sub/_mail';\n// export * from '../sub/_ticket';\n// export * from '../sub/_job';\n// export * from '../sub/_agent';\n// export * from './ticket';\n// export * from './job';\n// export * from './mail';\n// export * from './fusiontables';\n__export(__webpack_require__(/*! ./launcher */ \"./launcher.ts\"));\n__export(__webpack_require__(/*! ./types */ \"./types.ts\"));\n__export(__webpack_require__(/*! ./util */ \"./util.ts\"));\n\n\n//# sourceURL=webpack:///./handler.ts?");

/***/ }),

/***/ "./launcher.ts":
/*!*********************!*\
  !*** ./launcher.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\nvar __generator = (this && this.__generator) || function (thisArg, body) {\n    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;\n    return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;\n    function verb(n) { return function (v) { return step([n, v]); }; }\n    function step(op) {\n        if (f) throw new TypeError(\"Generator is already executing.\");\n        while (_) try {\n            if (f = 1, y && (t = y[op[0] & 2 ? \"return\" : op[0] ? \"throw\" : \"next\"]) && !(t = t.call(y, op[1])).done) return t;\n            if (y = 0, t) op = [0, t.value];\n            switch (op[0]) {\n                case 0: case 1: t = op; break;\n                case 4: _.label++; return { value: op[1], done: false };\n                case 5: _.label++; y = op[1]; op = [0]; continue;\n                case 7: op = _.ops.pop(); _.trys.pop(); continue;\n                default:\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }\n                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }\n                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }\n                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }\n                    if (t[2]) _.ops.pop();\n                    _.trys.pop(); continue;\n            }\n            op = body.call(thisArg, _);\n        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }\n        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };\n    }\n};\nvar _this = this;\nObject.defineProperty(exports, \"__esModule\", { value: true });\nvar awsXRay = __webpack_require__(/*! aws-xray-sdk */ \"aws-xray-sdk\");\nvar awsPlain = __webpack_require__(/*! aws-sdk */ \"aws-sdk\");\nvar AWS = awsXRay.captureAWS(awsPlain);\nvar sns = new AWS.SNS(), SNS_NOP = Boolean(process.env.SNS_NOP) || false;\n;\nvar TOPIC_PREFIX = 'arn:aws:sns:' + process.env.ARN_REGION_ACCOUNT + ':', CONSUME_TOPIC = TOPIC_PREFIX + 'drp-consume-ticket', PUT_JOB_TOPIC = TOPIC_PREFIX + 'drp-put-job', QUEUE_JOB_TOPIC = TOPIC_PREFIX + 'drp-queue-job', FINALIZE_JOB_TOPIC = TOPIC_PREFIX + 'drp-finalize-job', CREATE_AGENT_QUEUE_TOPIC = TOPIC_PREFIX + 'drp-create-agent-queue', DELETE_AGENT_QUEUE_TOPIC = TOPIC_PREFIX + 'drp-delete-agent-queue', QUEUE_THREADS_TOPIC = TOPIC_PREFIX + 'drp-queue-threads', QUEUE_MAILS_TOPIC = TOPIC_PREFIX + 'drp-queue-mails', PARSE_MAILS_TOPIC = TOPIC_PREFIX + 'drp-parse-mails', INSERT_REPORTS_TOPIC = TOPIC_PREFIX + 'drp-insert-reports', PUT_AGENT_TOPIC = TOPIC_PREFIX + 'drp-put-agent', CREATE_TABLE_TOPIC = TOPIC_PREFIX + 'drp-create-table', CHECK_TABLE_TOPIC = TOPIC_PREFIX + 'drp-check-table';\nexports.createTableAsync = function (ctm) {\n    return publish({\n        \"Message\": JSON.stringify(ctm),\n        \"Subject\": 'CreateTable',\n        \"TopicArn\": CREATE_TABLE_TOPIC\n    });\n};\nfunction checkTableAsync(ctm) {\n    return publish({\n        \"Message\": JSON.stringify(ctm),\n        \"Subject\": 'CheckTable',\n        \"TopicArn\": CHECK_TABLE_TOPIC\n    });\n}\nexports.checkTableAsync = checkTableAsync;\n;\nfunction putJobAsync(job) {\n    return publish({\n        \"Message\": JSON.stringify(job),\n        \"Subject\": 'PutJob',\n        \"TopicArn\": PUT_JOB_TOPIC\n    });\n}\nexports.putJobAsync = putJobAsync;\n;\nfunction finalizeJobAsync(job) {\n    return publish({\n        \"Message\": JSON.stringify(job),\n        \"Subject\": 'FinalizeJob',\n        \"TopicArn\": FINALIZE_JOB_TOPIC\n    });\n}\nexports.finalizeJobAsync = finalizeJobAsync;\n;\nfunction queueJobAsync(job) {\n    return publish({\n        \"Message\": JSON.stringify(job),\n        \"Subject\": 'QueueJob',\n        \"TopicArn\": QUEUE_JOB_TOPIC\n    });\n}\nexports.queueJobAsync = queueJobAsync;\n;\nfunction createAgentQueueAsync(job) {\n    return publish({\n        \"Message\": JSON.stringify(job),\n        \"Subject\": 'CreateAgentQueue',\n        \"TopicArn\": CREATE_AGENT_QUEUE_TOPIC\n    });\n}\nexports.createAgentQueueAsync = createAgentQueueAsync;\n;\nfunction deleteAgentQueueAsync(job) {\n    return publish({\n        \"Message\": JSON.stringify(job),\n        \"Subject\": 'DeleteAgentQueue',\n        \"TopicArn\": DELETE_AGENT_QUEUE_TOPIC\n    });\n}\nexports.deleteAgentQueueAsync = deleteAgentQueueAsync;\n;\nfunction putAgentAsync(agent) {\n    return publish({\n        \"Message\": JSON.stringify(agent),\n        \"Subject\": 'PutJob',\n        \"TopicArn\": PUT_JOB_TOPIC\n    });\n}\nexports.putAgentAsync = putAgentAsync;\n;\nfunction queueThreadsAsync(qtm) {\n    return publish({\n        \"Message\": JSON.stringify(qtm),\n        \"Subject\": 'QueueThreads',\n        \"TopicArn\": QUEUE_THREADS_TOPIC\n    });\n}\nexports.queueThreadsAsync = queueThreadsAsync;\n;\nfunction queueMailsAsync(qmm) {\n    return publish({\n        \"Message\": JSON.stringify(qmm),\n        \"Subject\": 'QueueMails',\n        \"TopicArn\": QUEUE_MAILS_TOPIC\n    });\n}\nexports.queueMailsAsync = queueMailsAsync;\n;\nfunction parseMailsAsync(pmm) {\n    return publish({\n        \"Message\": JSON.stringify(pmm),\n        \"Subject\": 'ParseMails',\n        \"TopicArn\": PARSE_MAILS_TOPIC\n    });\n}\nexports.parseMailsAsync = parseMailsAsync;\n;\nfunction insertReportsAsync(irm) {\n    return publish({\n        \"Message\": JSON.stringify(irm),\n        \"Subject\": 'RecordReports',\n        \"TopicArn\": INSERT_REPORTS_TOPIC\n    });\n}\nexports.insertReportsAsync = insertReportsAsync;\n;\nfunction consumeTicketsAsync(number) {\n    return publish({\n        \"Message\": String(number),\n        \"Subject\": 'ConsumeTicket',\n        \"TopicArn\": CONSUME_TOPIC\n    });\n}\nexports.consumeTicketsAsync = consumeTicketsAsync;\n;\nvar publish = function (input) { return __awaiter(_this, void 0, void 0, function () {\n    return __generator(this, function (_a) {\n        if (SNS_NOP) {\n            console.log('do publish provisionally:' + JSON.stringify(input));\n            return [2 /*return*/, Promise.resolve()];\n        }\n        console.log('do publish:' + JSON.stringify(input));\n        sns.publish(input).promise()\n            .then(function () {\n            return Promise.resolve();\n        })\n            .catch(function (err) {\n            return Promise.reject(err);\n        });\n        return [2 /*return*/];\n    });\n}); };\n\n\n//# sourceURL=webpack:///./launcher.ts?");

/***/ }),

/***/ "./types.ts":
/*!******************!*\
  !*** ./types.ts ***!
  \******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nvar JobStatus;\n(function (JobStatus) {\n    JobStatus[JobStatus[\"Created\"] = 0] = \"Created\";\n    JobStatus[JobStatus[\"Processing\"] = 1] = \"Processing\";\n    JobStatus[JobStatus[\"Done\"] = 2] = \"Done\";\n    JobStatus[JobStatus[\"Cancelled\"] = 3] = \"Cancelled\";\n})(JobStatus = exports.JobStatus || (exports.JobStatus = {}));\n// export as namespace DamageReportPlots;\n// declare module \"*.json\" {\n//     const value: any;\n//     export default value;\n// }\n\n\n//# sourceURL=webpack:///./types.ts?");

/***/ }),

/***/ "./util.ts":
/*!*****************!*\
  !*** ./util.ts ***!
  \*****************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n// import cookieLib = require('cookie');\nObject.defineProperty(exports, \"__esModule\", { value: true });\n/**\n * 階層オブジェクトの存在チェック\n * @param  {Function} fn [description]\n * @return {boolean}     [description]\n */\nfunction isSet(fn) {\n    var value;\n    try {\n        value = fn();\n    }\n    catch (err) {\n        value = undefined;\n    }\n    finally {\n        return value !== undefined;\n    }\n}\nexports.isSet = isSet;\n;\n/**\n * epoch time(ms)をISO形式日付文字列へ\n */\nfunction toString(ms) {\n    return (new Date(ms)).toISOString();\n}\nexports.toString = toString;\n;\n\n\n//# sourceURL=webpack:///./util.ts?");

/***/ }),

/***/ "aws-sdk":
/*!**************************!*\
  !*** external "aws-sdk" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"aws-sdk\");\n\n//# sourceURL=webpack:///external_%22aws-sdk%22?");

/***/ }),

/***/ "aws-xray-sdk":
/*!*******************************!*\
  !*** external "aws-xray-sdk" ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"aws-xray-sdk\");\n\n//# sourceURL=webpack:///external_%22aws-xray-sdk%22?");

/***/ })

/******/ })));