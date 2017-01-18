'use strict';
const mqtt = require('mqtt');
const _ = require('underscore');
const should = require('should');

describe('pomelo data source connector use case test', ()=> {
    describe('mqtt client subscribe topic', ()=> {
        context('mqtt client subscribe ${dataSourceID} topic', ()=> {
            let client;
            it('data source is invalid then client no happen,server is log', done=> {
                client = mqtt.connect('mqtt://127.0.0.1:3011');
                client.on('connect', ()=> {
                    client.subscribe('no-data-source');
                    done();
                });
            });
            after(done=> {
                client.end(()=> {
                    done();
                })
            });
        });
    });
    describe('mqtt client publish topic', ()=> {
        context('public a error topic', ()=> {
            let client;
            it('client is no happen,server is log', done=> {
                client = mqtt.connect('mqtt://127.0.0.1:3011');
                client.on('connect', ()=> {
                    client.publish('error-topic', 'this is a error topic');
                    done();
                });
            });
            after(done=> {
                client.end(()=> {
                    done();
                })
            })
        });
        context('data source publish topic', ()=> {
            let client;
            it('public a data source topic is invalid then client is no happen,server is log', done=> {
                client = mqtt.connect('mqtt://127.0.0.1:3011');
                let payload = JSON.stringify({
                    v: 100,
                    t: (new Date()).getTime()
                });
                client.on('connect', ()=> {
                    client.publish('rd/no-data-source', payload);
                    done();
                });
            });
            after(done=> {
                client.end(()=> {
                    done();
                })
            })
        });
    });
});