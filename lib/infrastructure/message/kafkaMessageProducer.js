'use strict';
const {KafkaZipkinMessageProducer} = require('gridvo-common-js');
const {tracer} = require('../../util');

class MessageProducer {
    constructor() {
        this._producer = new KafkaZipkinMessageProducer({
            tracer,
            serviceName: "data-source-interaction"
        });
    }

    produceDataArriveTopicMessage(message, traceContext, callback) {
        this._producer.produceMessage("data-arrive", message, traceContext, callback);
    }

    produceDataSourceUpdateTopicMessage(message, traceContext, callback) {
        this._producer.produceMessage("data-source-update", message, traceContext, callback);
    }

    close() {
        return this._producer.close();
    }
}

module.exports = MessageProducer;