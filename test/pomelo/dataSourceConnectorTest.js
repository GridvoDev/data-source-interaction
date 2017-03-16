'use strict';
const mqtt = require('mqtt');
const _ = require('underscore');
const should = require('should');

describe('pomelo data source connector use case test', () => {
    describe('mqtt client publish topic', () => {
        context('public a error topic', () => {
            let client;
            it('client is no happen,server is log', done => {
                client = mqtt.connect('mqtt://127.0.0.1:3011');
                client.on('connect', () => {
                    client.publish('/error/topic', 'this is a error topic');
                    done();
                });
            });
        });
    });
    describe('mqtt client subscribe topic', () => {
        context('subscribe a error topic', () => {
            let client;
            it('client is disconnect,server is log', done => {
                client = mqtt.connect('mqtt://127.0.0.1:3011');
                client.on('connect', () => {
                    client.subscribe('/rt/GF/FZMHQJT/FWJ/error');
                    done();
                });
            });
        });
    });
});