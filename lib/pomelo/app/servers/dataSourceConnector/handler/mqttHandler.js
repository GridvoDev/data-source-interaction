'use strict';
const co = require('co');
const _ = require('underscore');
const {logger} = require('../../../../../util');
const {createDataService} = require('../../../../../application');
const {pomeloWithZipkinTraceContextFeach:traceContextFeach} = require("gridvo-common-js");

let Handler = function (app) {
    this._app = app;
    this._dataService = createDataService();
};

Handler.prototype.publish = function (msg, session, next) {
    let {topic, payload} = msg;
    let dataSourceID;
    let traceContext = traceContextFeach(session);
    let self = this;

    function authDataSource(dataSourceID) {
        return new Promise((resolve, reject) => {
            self._dataService.authDataSource(dataSourceID, traceContext, (err, dataSourceJSON) => {
                if (err) {
                    reject(err);
                }
                resolve(dataSourceJSON);
            });
        });
    }

    function binDataSourceID(dataSourceID) {
        return new Promise((resolve, reject) => {
            session.bind(dataSourceID, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    function binDataSourcePro(dataSourceJSON) {
        return new Promise((resolve, reject) => {
            session.set('station', dataSourceJSON.station);
            session.set('lessee', dataSourceJSON.lessee);
            session.pushAll((err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    function joinChannel(dataSourceJSON) {
        return new Promise((resolve, reject) => {
            let stationChannel = self._app.get('channelService').getChannel(dataSourceJSON.station, true);
            let lesseeChannel = self._app.get('channelService').getChannel(dataSourceJSON.lessee, true);
            if (!stationChannel || !lesseeChannel) {
                reject(new Error("get channel error"));
            }
            stationChannel.add(session.uid, self._app.getServerId());
            lesseeChannel.add(session.uid, self._app.getServerId());
        });
    }

    function* dataSourceLink() {
        let dataSourceJSON = yield authDataSource(dataSourceID);
        if (!dataSourceJSON) {
            logger.warn(`invalid data source: ${dataSourceID} link`, traceContext);
            return {
                errcode: 400,
                errmsg: "fail"
            };
        }
        yield binDataSourceID(dataSourceID);
        yield binDataSourcePro(dataSourceJSON);
        session.on('closed', onSessionClosed.bind(null, self._app));
        yield joinChannel();
        logger.info(`data source: ${dataSourceID} link success`, traceContext);
        return {
            errcode: 0,
            errmsg: "ok"
        };
    };

    if (!session || !session.uid) {
        dataSourceID = topic ? topic : "noDataSourceID";
        co(dataSourceLink).then((res) => {
            if (res.errcode == 400) {
                self._app.get("sessionService").kickBySessionId(session.id, "close client", (err) => {
                    if (err) {
                        logger.error(err.message, traceContext);
                    }
                });
                next(null, res);
                return;
            }
        }).catch(err => {
            logger.error(err.stack, traceContext);
            next(err);
            return;
        });
    }
    let originalData = {};
    originalData.s = topic;
    let {v, t} = JSON.parse(payload);
    originalData.v = v;
    originalData.t = t;
    self._dataService.receiveOriginalData(originalData, traceContext, (err, isSuccess) => {
        if (err) {
            logger.error(err.message, traceContext);
            next(err);
        }
        if (isSuccess) {
            logger.info(`receive data: ${originalData.s} ${payload} success`, traceContext);
            next(null, {
                errcode: 0,
                errmsg: "ok"
            });
        }
        else {
            logger.error(`receive data: ${originalData.s} ${payload} fail`, traceContext);
            next(null, {
                errcode: 400,
                errmsg: "fail"
            });
        }
    });
};

Handler.prototype.subscribe = function (msg, session, next) {
    let topic = msg.subscriptions[0].topic;
    let traceContext = traceContextFeach(session);
    next(null, topic);
};

let onSessionClosed = function (app, session) {
    if (!session || !session.uid) {
        logger.warn(`invalid data source link closed`);
        return;
    }
    let stationChannel = app.get('channelService').getChannel(session.get('station'), false);
    let lesseeChannel = app.get('channelService').getChannel(session.get('lessee'), false);
    if (!stationChannel || !lesseeChannel) {
        logger.error(`get channel error`);
        return;
    }
    stationChannel.leave(session.uid, app.getServerId());
    lesseeChannel.leave(session.uid, app.getServerId());
    logger.warn(`data source: ${session.uid} closed link`);
}

module.exports = function (app) {
    return new Handler(app);
};
