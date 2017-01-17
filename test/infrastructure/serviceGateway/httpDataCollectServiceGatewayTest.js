'use strict';
const _ = require('underscore');
const co = require('co');
const should = require('should');
const express = require('express');
const HttpDataCollectServiceGateway = require('../../../lib/infrastructure/serviceGateway/httpDataCollectServiceGateway');
const {TraceContext} = require('gridvo-common-js');

describe('HttpDataCollectServiceGateway use case test', ()=> {
    let app;
    let server;
    let gateway;
    before(done=> {
        function setupExpress() {
            return new Promise((resolve, reject)=> {
                app = express();
                app.get('/data-sources/:dataSourceID', (req, res)=> {
                    if (req.params.dataSourceID == "station-type-other") {
                        res.json({
                            errcode: 0,
                            errmsg: "ok",
                            dataSource: {
                                id: "station-type-other",
                                station: "stationID",
                                lessee: "lesseeID"
                            }
                        });
                    }
                    else {
                        res.json({
                            errcode: 400,
                            errmsg: "fail"
                        });
                    }
                });
                server = app.listen(3001, err=> {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        };
        function* setup() {
            yield setupExpress();
        };
        co(setup).then(()=> {
            gateway = new HttpDataCollectServiceGateway();
            done();
        }).catch(err=> {
            done(err);
        });
    });
    describe('getDataSource(dataSourceID, traceContext, callback)', ()=> {
        let traceContext = new TraceContext({
            traceID: "aaa",
            parentID: "bbb",
            spanID: "ccc",
            flags: 1,
            step: 3
        });
        context('get data source)', ()=> {
            it('should return null if no this data source or other fail', done=> {
                gateway.getDataSource("noID", traceContext, (err, url)=> {
                    _.isNull(url).should.be.eql(true);
                    done();
                });
            });
            it('is ok', done=> {
                gateway.getDataSource("station-type-other", traceContext, (err, dataSourceJSON)=> {
                    dataSourceJSON.id.should.be.eql("station-type-other");
                    done();
                });
            });
        });
    });
    after(done=> {
        function teardownExpress() {
            return new Promise((resolve, reject)=> {
                server.close(err=> {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        };
        function* teardown() {
            yield teardownExpress();
        };
        co(teardown).then(()=> {
            done();
        }).catch(err=> {
            done(err);
        })
    });
});