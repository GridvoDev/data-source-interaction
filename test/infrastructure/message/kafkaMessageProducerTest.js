'use strict';
const kafka = require('kafka-node');
const _ = require('underscore');
const should = require('should');
const KafkaMessageProducer = require('../../../lib/infrastructure/message/kafkaMessageProducer');

describe('KafkaMessageProducer(topic, options) use case test', ()=> {
    let messageProducer;
    let consumer;
    before(done=> {
        let {ZOOKEEPER_SERVICE_HOST = "127.0.0.1", ZOOKEEPER_SERVICE_PORT = "2181"} = process.env;
        let client = new kafka.Client(
            `${ZOOKEEPER_SERVICE_HOST}:${ZOOKEEPER_SERVICE_PORT}`,
            "data-source-interaction-producer-client");
        let initProducer = new kafka.Producer(client);
        initProducer.on('ready', ()=> {
            initProducer.createTopics(["data-arrive"], true, (err, data)=> {
                if (err) {
                    done(err)
                }
                client.refreshMetadata(["data-arrive"], (err)=> {
                    if (err) {
                        done(err)
                    }
                    messageProducer = new KafkaMessageProducer();
                    done();
                    initProducer.close();
                });
            });
        });
        initProducer.on('error', (err)=> {
            done(err);
        });
    });
    describe('#produce{Topic}Message(message, traceContext, callback)', ()=> {
        context('produce topic message', ()=> {
            it('should return null if no message', done=> {
                let message = null;
                let traceContext = {};
                messageProducer.produceDataArriveTopicMessage(message, traceContext, (err, data)=> {
                    if (err) {
                        done(err);
                    }
                    _.isNull(data).should.be.eql(true);
                    done();
                });
            });
            it('should return data if message is send success', done=> {
                let message = {
                    s: "rd/station",
                    v: 100,
                    t: 1403610513000
                };
                let traceContext = {};
                messageProducer.produceDataArriveTopicMessage(message, traceContext, (err, data)=> {
                    if (err) {
                        done(err);
                    }
                    _.isNull(data).should.be.eql(false);
                    let {ZOOKEEPER_SERVICE_HOST = "127.0.0.1", ZOOKEEPER_SERVICE_PORT = "2181"} = process.env;
                    let client = new kafka.Client(`${ZOOKEEPER_SERVICE_HOST}:${ZOOKEEPER_SERVICE_PORT}`);
                    let topics = [{
                        topic: "data-arrive"
                    }];
                    let options = {
                        groupId: "test-group"
                    };
                    consumer = new kafka.HighLevelConsumer(client, topics, options);
                    consumer.on('message', function (message) {
                        let data = JSON.parse(message.value);
                        data.s.should.be.eql("rd/station");
                        data.v.should.be.eql(100);
                        data.t.should.be.eql(1403610513000);
                        done();
                    });
                });
            });
            after(done=> {
                consumer.close(true, (err)=> {
                    if (err) {
                        done(err);
                    }
                    done();
                });
            });
        });
    });
    after(done=> {
        messageProducer.close().then(done);
    });
});