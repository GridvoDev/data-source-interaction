'use strict';
const {Log4jsLogger} = require("gridvo-common-js");

let {IS_DEBUG} = process.env;
let logger = new Log4jsLogger({
    serviceName: "data-source-interaction"
});
if (IS_DEBUG) {
    logger.setLevel("debug");
}
module.exports = logger;