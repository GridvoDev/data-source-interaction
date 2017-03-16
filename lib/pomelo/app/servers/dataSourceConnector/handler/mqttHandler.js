'use strict';
const co = require('co');
const _ = require('underscore');
const {
    logger,
    parseOriginalDataFromMqttData,
    parseDataSourceIDFromTopic,
    parseActionFromTopic
} = require('../../../../../util');
const {createDataService} = require('../../../../../application');
const {pomeloWithZipkinTraceContextFeach:traceContextFeach} = require("gridvo-common-js");

let Handler = function (app) {
    this._app = app;
    this._dataService = createDataService();
};

Handler.prototype.publish = function (msg, session, next) {
    let {topic, payload} = msg;
    let traceContext = traceContextFeach(session);
    if (!topic || topic.length == 0) {
        logger.info(`invalid topic: ${topic}`, traceContext);
        next(null, {
            errcode: 400,
            errmsg: "fail"
        });
        return;
    }
    let action = parseActionFromTopic(topic);
    let self = this;

    function receiveOriginalData() {
        let originalData = parseOriginalDataFromMqttData({topic, payload});
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
    }

    if (session && session.uid && (action == "publish")) {
        receiveOriginalData();
    } else {
        self._app.get("sessionService").kickBySessionId(session.id, "close client", (err) => {
            if (err) {
                logger.error(err.message, traceContext);
                next(err, {
                    errcode: 400,
                    errmsg: "fail"
                });
            }
            else {
                next(null, {
                    errcode: 400,
                    errmsg: "fail"
                });
            }
        });
    }
};

Handler.prototype.subscribe = function (msg, session, next) {
    let granted = [msg.subscriptions[0].qos];
    let topic = msg.subscriptions[0].topic;
    let traceContext = traceContextFeach(session);
    if (!topic || topic.length == 0) {
        logger.info(`invalid topic: ${topic}`, traceContext);
        next(null, []);
        return;
    }
    let dataSourceID = parseDataSourceIDFromTopic(topic);
    let action = parseActionFromTopic(topic);
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
            session.set('topics', []);
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
            resolve();
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
        yield joinChannel(dataSourceJSON);
        let linkedMsg = {
            retain: false,
            qos: 0,
            dup: false,
            topic,
            payload: JSON.stringify({v: "linked"})
        };
        self._app.get('channelService').pushMessageByUids(linkedMsg, [{
            uid: dataSourceID,
            sid: self._app.getServerId()
        }]);
        logger.info(`data source: ${dataSourceID} link success`, traceContext);
        return {
            errcode: 0,
            errmsg: "ok"
        };
    };

    if (!session || !session.uid) {
        if (action !== "link") {
            self._app.get("sessionService").kickBySessionId(session.id, "close client", (err) => {
                if (err) {
                    logger.error(err.message, traceContext);
                }
            });
            next(null, {
                errcode: 400,
                errmsg: "fail"
            });
            return;
        }
        co(dataSourceLink).then((res) => {
            if (res.errcode == 0) {
                next(null, granted);
            } else {
                self._app.get("sessionService").kickBySessionId(session.id, "close client", (err) => {
                    if (err) {
                        logger.error(err.message, traceContext);
                    }
                });
                next(null, []);
            }
        }).catch(err => {
            logger.error(err.stack, traceContext);
            next(err);
        });
    } else {
        let channel = self._app.get('channelService').getChannel(topic, true);
        channel.add(session.uid, self._app.getServerId());
        let topics = session.get('topics');
        topics.push(topic);
        session.set('topics', topics);
        session.pushAll((err) => {
            if (err) {
                logger.error(err.message, traceContext);
            }
        });
        next(null, granted);
    }
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
    let topics = session.get('topics');
    for (let topic of topics) {
        let channel = app.get('channelService').getChannel(topic, false);
        if (!channel) {
            logger.error(`get channel error`);
            return;
        }
        channel.leave(session.uid, app.getServerId());
    }
    logger.warn(`data source: ${session.uid} closed link`);
}

module.exports = function (app) {
    return new Handler(app);
};
