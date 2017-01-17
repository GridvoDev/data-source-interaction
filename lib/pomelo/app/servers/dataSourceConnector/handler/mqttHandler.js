'use strict';
const co = require('co');
const _ = require('underscore');
const {logger} = require('../../../../../util');
const {pomeloWithZipkinTraceContextFeach:traceContextFeach} = require("gridvo-common-js");

let Handler = function (app) {
    this.app = app;
};

Handler.prototype.publish = function (msg, session, next) {
    let {topic, payload} = msg;
    if (topic.indexOf("rd/") == 0) {
        let originalData = {};
        originalData.s = topic.slice(2);
        let {vl, ts} = JSON.parse(payload);
        originalData.v = vl;
        originalData.t = ts;
        let traceContext = traceContextFeach(msg);
        logger.info(JSON.stringify(traceContext));
        logger.info(`data source publish: ${topic} ${payload}`);
        next(null, {
            errcode: 0,
            errmsg: "ok"
        });
    }
    else {
        logger.error(`data source publish a error topic: ${topic}`);
        next(null, {
            errcode: 500,
            errmsg: "fail"
        });
    }
};

Handler.prototype.subscribe = function (msg, session, next) {
    let traceContext = traceContextFeach(msg);
    logger.info(`data source publish: ${topic} ${payload}`);
    next(null, {
        errcode: 0,
        errmsg: "ok"
    });
};

module.exports = function (app) {
    return new Handler(app);
};
