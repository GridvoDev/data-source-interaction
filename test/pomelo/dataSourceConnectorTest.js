'use strict';
const mqtt = require('mqtt');
const _ = require('underscore');
const should = require('should');

describe('pomelo data source connector use case test', ()=> {
    describe('mqtt client publish topic', ()=> {
        context('public a error topic', ()=> {
            let client;
            it('public a error topic', done=> {
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
            it('public a topic', done=> {
                client = mqtt.connect('mqtt://127.0.0.1:3011');
                let payload = JSON.stringify({
                    vl: 100,
                    ts: (new Date()).getTime()
                });
                client.on('connect', ()=> {
                    client.publish('rd/YNLCNWHEJZ/Gen1/P', payload);
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