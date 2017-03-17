'use strict';
const _ = require('underscore');
const should = require('should');
const muk = require('muk');
const DataService = require('../../../lib/application/service/dataService');

describe('dataService use case test', () => {
    let service;
    before(() => {
        service = new DataService();
    });
    describe('#authDataSource(dataSourceID, traceContext, callback)', () => {
        context('auth data source from data-collect microservice)', () => {
            it('return null if no this data source or data-collect microservice is fail', done => {
                let mockDataCollectServiceGateway = {};
                mockDataCollectServiceGateway.getDataSource = (dataSourceID, traceContext, callback) => {
                    callback(null, null);
                };
                muk(service, "_dataCollectServiceGateway", mockDataCollectServiceGateway);
                service.authDataSource("noID", {}, (err, dataSourceJSON) => {
                    _.isNull(dataSourceJSON).should.be.eql(true);
                    done();
                });
            });
            it('return data source json if hanve this data source', done => {
                let mockDataCollectServiceGateway = {};
                mockDataCollectServiceGateway.getDataSource = (dataSourceID, traceContext, callback) => {
                    callback(null, {
                        id: "station-type-other",
                        station: "stationID",
                        lessee: "lesseeID"
                    });
                };
                muk(service, "_dataCollectServiceGateway", mockDataCollectServiceGateway);
                service.authDataSource("station-id", {}, (err, dataSourceJSON) => {
                    dataSourceJSON.id.should.be.eql("station-type-other");
                    done();
                });
            });
        });
    });
    describe('#publishOriginalData(originalData, traceContext, callback)', () => {
        context('publish data source published original data)', () => {
            it('return false if MessageProducer produce data-arrive message fail', done => {
                let mockMessageProducer = {};
                mockMessageProducer.produceDataArriveTopicMessage = (message, traceContext, callback) => {
                    callback(null, null);
                };
                muk(service, "_messageProducer", mockMessageProducer);
                service.publishOriginalData({}, {}, (err, isSuccess) => {
                    isSuccess.should.be.eql(false);
                    done();
                });
            });
            it('return true if MessageProducer produce data-arrive message success', done => {
                let mockMessageProducer = {};
                mockMessageProducer.produceDataArriveTopicMessage = (message, traceContext, callback) => {
                    callback(null, {});
                };
                muk(service, "_messageProducer", mockMessageProducer);
                service.publishOriginalData({}, {}, (err, isSuccess) => {
                    isSuccess.should.be.eql(true);
                    done();
                });
            });
        });
    });
    describe('#configUpdateACK(updateResult, traceContext, callback)', () => {
        context('config update ack)', () => {
            it('return false if MessageProducer produce data-source-update message fail', done => {
                let mockMessageProducer = {};
                mockMessageProducer.produceDataSourceUpdateTopicMessage = (message, traceContext, callback) => {
                    callback(null, null);
                };
                muk(service, "_messageProducer", mockMessageProducer);
                service.configUpdateACK({}, {}, (err, isSuccess) => {
                    isSuccess.should.be.eql(false);
                    done();
                });
            });
            it('return true if MessageProducer produce data-source-update message success', done => {
                let mockMessageProducer = {};
                mockMessageProducer.produceDataSourceUpdateTopicMessage = (message, traceContext, callback) => {
                    callback(null, {});
                };
                muk(service, "_messageProducer", mockMessageProducer);
                service.configUpdateACK({}, {}, (err, isSuccess) => {
                    isSuccess.should.be.eql(true);
                    done();
                });
            });
        });
    });
    after(() => {
        muk.restore();
    });
});