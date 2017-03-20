'use strict';
const _ = require('underscore');
const should = require('should');
const {
    parseOriginalDataFromMqttData,
    parseDataSourceIDFromTopic,
    parseActionFromTopic,
    parseConfigUpdateResultFromMqttData,
    parseDataSourceConfigMqttTopicFromKafka
} = require('../../lib/util/parse');

describe('parse util unit test', () => {
    describe('parseDataSourceIDFromTopic(topic)', () => {
        context('parse data source id from topic', () => {
            let topic = "/rt/GF/FZMHQJT/FWJ/publish";
            let dataSource = parseDataSourceIDFromTopic(topic);
            dataSource.should.eql("GF-FZMHQJT-FWJ");
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
            it('is ok', () => {
                let mqttData = {
                    topic: "/rt/GF/FZMHQJT/FWJ/publish",
                    payload: JSON.stringify({v: "body", t: 1})
                }
                let originalData = parseOriginalDataFromMqttData(mqttData);
                originalData.s.should.eql("GF-FZMHQJT-FWJ");
                originalData.v.should.eql("body");
                originalData.t.should.eql(1);
            });
        });
    });
    describe('parseConfigUpdateResultFromMqttData(mqttData)', () => {
        context('parse update result from mqtt data', () => {
            it('is ok', () => {
                let mqttData = {
                    topic: "/rt/GF/FZMHQJT/FWJ/publish",
                    payload: JSON.stringify({v: "ok", t: 1})
                }
                let updateResult = parseConfigUpdateResultFromMqttData(mqttData);
                updateResult.s.should.eql("GF-FZMHQJT-FWJ");
                updateResult.v.should.eql("ok");
                updateResult.t.should.eql(1);
            });
        });
    });
    describe('parseDataSourceConfigMqttTopicFromKafka(dataSourceConfigTopicMessage)', () => {
        context('parse mqtt topic from kafka message', () => {
            it('is ok', () => {
                let dataSourceConfigTopicMessage = {
                    dataSourceID: "GF-FZMHQJT-FWJ"
                }
                let mqttTopic = parseDataSourceConfigMqttTopicFromKafka(dataSourceConfigTopicMessage);
                mqttTopic.should.eql("/rt/GF/FZMHQJT/FWJ/config");
            });
        });
    });
});