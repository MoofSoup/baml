"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBamlValidationError = exports.BamlValidationError = exports.BamlClientFinishReasonError = exports.BamlCtxManager = exports.BamlStream = exports.BamlLogEvent = exports.ClientRegistry = exports.invoke_runtime_cli = exports.Audio = exports.ClientBuilder = exports.Image = exports.FunctionResultStream = exports.FunctionResult = exports.BamlRuntime = void 0;
var native_1 = require("./native");
Object.defineProperty(exports, "BamlRuntime", { enumerable: true, get: function () { return native_1.BamlRuntime; } });
Object.defineProperty(exports, "FunctionResult", { enumerable: true, get: function () { return native_1.FunctionResult; } });
Object.defineProperty(exports, "FunctionResultStream", { enumerable: true, get: function () { return native_1.FunctionResultStream; } });
Object.defineProperty(exports, "Image", { enumerable: true, get: function () { return native_1.BamlImage; } });
Object.defineProperty(exports, "ClientBuilder", { enumerable: true, get: function () { return native_1.ClientBuilder; } });
Object.defineProperty(exports, "Audio", { enumerable: true, get: function () { return native_1.BamlAudio; } });
Object.defineProperty(exports, "invoke_runtime_cli", { enumerable: true, get: function () { return native_1.invoke_runtime_cli; } });
Object.defineProperty(exports, "ClientRegistry", { enumerable: true, get: function () { return native_1.ClientRegistry; } });
Object.defineProperty(exports, "BamlLogEvent", { enumerable: true, get: function () { return native_1.BamlLogEvent; } });
var stream_1 = require("./stream");
Object.defineProperty(exports, "BamlStream", { enumerable: true, get: function () { return stream_1.BamlStream; } });
var async_context_vars_1 = require("./async_context_vars");
Object.defineProperty(exports, "BamlCtxManager", { enumerable: true, get: function () { return async_context_vars_1.BamlCtxManager; } });
class BamlClientFinishReasonError extends Error {
    prompt;
    raw_output;
    constructor(prompt, raw_output, message) {
        super(message);
        this.name = "BamlClientFinishReasonError";
        this.prompt = prompt;
        this.raw_output = raw_output;
        Object.setPrototypeOf(this, BamlClientFinishReasonError.prototype);
    }
    toJSON() {
        return JSON.stringify({
            name: this.name,
            message: this.message,
            raw_output: this.raw_output,
            prompt: this.prompt,
        }, null, 2);
    }
    static from(error) {
        if (error.message.includes("BamlClientFinishReasonError")) {
            try {
                const errorData = JSON.parse(error.message);
                if (errorData.type === "BamlClientFinishReasonError") {
                    return new BamlClientFinishReasonError(errorData.prompt || "", errorData.raw_output || "", errorData.message || error.message);
                }
                else {
                    console.warn("Not a BamlClientFinishReasonError:", error);
                }
            }
            catch (parseError) {
                // If JSON parsing fails, fall back to the original error
                console.warn("Failed to parse BamlClientFinishReasonError:", parseError);
            }
        }
        return undefined;
    }
}
exports.BamlClientFinishReasonError = BamlClientFinishReasonError;
class BamlValidationError extends Error {
    prompt;
    raw_output;
    constructor(prompt, raw_output, message) {
        super(message);
        this.name = "BamlValidationError";
        this.prompt = prompt;
        this.raw_output = raw_output;
        Object.setPrototypeOf(this, BamlValidationError.prototype);
    }
    toJSON() {
        return JSON.stringify({
            name: this.name,
            message: this.message,
            raw_output: this.raw_output,
            prompt: this.prompt,
        }, null, 2);
    }
    static from(error) {
        if (error.message.includes("BamlValidationError")) {
            try {
                const errorData = JSON.parse(error.message);
                if (errorData.type === "BamlValidationError") {
                    return new BamlValidationError(errorData.prompt || "", errorData.raw_output || "", errorData.message || error.message);
                }
            }
            catch (parseError) {
                console.warn("Failed to parse BamlValidationError:", parseError);
            }
        }
        return undefined;
    }
}
exports.BamlValidationError = BamlValidationError;
// Helper function to safely create a BamlValidationError
function createBamlValidationError(error) {
    const bamlValidationError = BamlValidationError.from(error);
    if (bamlValidationError) {
        return bamlValidationError;
    }
    const bamlClientFinishReasonError = BamlClientFinishReasonError.from(error);
    if (bamlClientFinishReasonError) {
        return bamlClientFinishReasonError;
    }
    // otherwise return the original error
    return error;
}
exports.createBamlValidationError = createBamlValidationError;
// No need for a separate throwBamlValidationError function in TypeScript
