'use strict';
const _ = require('underscore');
const {createDataCollectServiceGateway, createMessageProducer} = require('../../infrastructure');

class Service {
    constructor() {
        this._messageProducer = createMessageProducer();
        this._dataCollectServiceGateway = createDataCollectServiceGateway();
    }

    authDataSource(dataSourceID, traceContext, callback) {
        if (!dataSourceID) {
            callback(null, null);
            return;
        }
        this._dataCollectServiceGateway.getDataSource(dataSourceID, traceContext, (err, dataSourceJSON) => {
                if (err) {
                    callback(err, null);
                    return;
                }
                callback(null, dataSourceJSON);
            }
        );
    }

    publishOriginalData(originalData, traceContext, callback) {
        let message = originalData;
        this._messageProducer.produceDataArriveTopicMessage(message, traceContext, (err, data) => {
            if (err) {
                callback(err);
                return;
            }
            if (data) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        });
    }

    configUpdateACK(updateResult, traceContext, callback) {
        let message = updateResult;
        this._messageProducer.produceDataSourceUpdateTopicMessage(message, traceContext, (err, data) => {
            if (err) {
                callback(err);
                return;
            }
            if (data) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        });
    }

}

module.exports = Service;