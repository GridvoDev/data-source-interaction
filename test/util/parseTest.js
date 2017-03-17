'use strict';
const _ = require('underscore');
const should = require('should');
const {
    parseOriginalDataFromMqttData,
    parseDataSourceIDFromTopic,
    parseActionFromTopic,
    parseConfigUpdateResultFromMqttData
} = require('../../lib/util/parse');

describe('parse util unit test', () => {
    describe('parseDataSourceIDFromTopic(topic)', () => {
        context('parse data source id from topic', () => {
            let topic = "/rt/GF/FZMHQJT/FWJ/publish";
            let dataSource = parseDataSourceIDFromTopic(topic);
            dataSource.should.eql("FZMHQJT-FWJ");
        });
    });
    describe('parseActionFromTopic(topic)', () => {
        context('parse action from topic', () => {
            let topic = "/rt/GF/FZMHQJT/FWJ/publish";
            let action = parseActionFromTopic(topic);
            action.should.eql("publish");
        });
    });
    describe('parseOriginalDataFromMqttData(mqttData)', () => {
        context('parse original data from mqtt data', () => {
            let client;
            it('is ok', () => {
                let mqttData = {
                    topic: "/rt/GF/FZMHQJT/FWJ/publish",
                    payload: JSON.stringify({v: "body", t: 1})
                }
                let originalData = parseOriginalDataFromMqttData(mqttData);
                originalData.s.should.eql("FZMHQJT-FWJ");
                originalData.v.should.eql("body");
                originalData.t.should.eql(1);
            });
        });
    });
    describe('parseConfigUpdateResultFromMqttData(mqttData)', () => {
        context('parse update result from mqtt data', () => {
            let client;
            it('is ok', () => {
                let mqttData = {
                    topic: "/rt/GF/FZMHQJT/FWJ/publish",
                    payload: JSON.stringify({v: "ok", t: 1})
                }
                let updateResult = parseConfigUpdateResultFromMqttData(mqttData);
                updateResult.s.should.eql("FZMHQJT-FWJ");
                updateResult.v.should.eql("ok");
                updateResult.t.should.eql(1);
            });
        });
    });
})
;