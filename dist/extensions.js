"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const runParseCommand_1 = require("./commands/runParseCommand");
function activate(context) {
    context.subscriptions.push((0, runParseCommand_1.registerRunParseCommand)(context));
    console.log('Dart JSON Validator (Runner) activated');
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extensions.js.map