'use strict';
const kafka = require('kafka-node');
const {KafkaZipkinMessageConsumer, kafkaWithZipkinTraceContextFeach} = require('gridvo-common-js');
const {logger, tracer, parse} = require('../../../util');

let Component = function (app, opts) {
    this._app = app;
    this._consumer = new KafkaZipkinMessageConsumer({tracer, serviceName: "data-source-interaction"});
};

Component.prototype.start = function (cb) {
    let {ZOOKEEPER_SERVICE_HOST = "127.0.0.1", ZOOKEEPER_SERVICE_PORT = "2181"} = process.env;
    let Producer = kafka.HighLevelProducer;
    let client = new kafka.Client(`${ZOOKEEPER_SERVICE_HOST}:${ZOOKEEPER_SERVICE_PORT}`);
    let initProducer = new Producer(client);
    initProducer.on('ready', function () {
        initProducer.createTopics(["data-source-config",
            "zipkin"], true, (err) => {
            if (err) {
                logger.error(err.message);
                return;
            }
            client.refreshMetadata(["data-source-config",
                "zipkin"], () => {
                initProducer.close(() => {
                    logger.info("init kafka topics success");
                    process.nextTick(cb);
                });
            });
        });
    });
    initProducer.on('error', (err) => {
        logger.error(err.message);
        process.nextTick(cb);
    });
};

Component.prototype.afterStart = function (cb) {
    let topics = [{
        topic: "data-source-config"
    }];
    let self = this;
    this._consumer.consumeMessage(topics, (err, message) => {
        if (err) {
            logger.error(err.message);
            return;
        }
        let data = JSON.parse(message.value);
        let traceContext = kafkaWithZipkinTraceContextFeach(data);
        switch (message.topic) {
            case "data-source-config":
                delete data.zipkinTrace;
                let configTopic = parse.parseDataSourceUpdateMqttTopicFromKafka(data);
                let channel = self._app.get('channelService').getChannel(configTopic, true);
                let msg = {
                    retain: false,
                    qos: 0,
                    dup: false,
                    topic: configTopic,
                    payload: JSON.stringify(configs),
                };
                channel.pushMessage(msg, (err) => {
                    if (err) {
                        logger.error(err.message, traceContext);
                        return;
                    }
                    logger.info(`config "${configTopic}" success`, traceContext);
                });
                return;
            default:
                logger.error(`unknow kafka topic "${message.topic}"`, traceContext);
                return;
        }
    });
    logger.info("start consuming topics");
    process.nextTick(cb);
};

Component.prototype.stop = function (force, cb) {
    this._consumer.close(cb);
};

module.exports = function (app, opts) {
    return new Component(app, opts);
};