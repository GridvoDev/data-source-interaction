'use strict';
const rest = require('rest');
const mime = require('rest/interceptor/mime');
const {restZipkinInterceptor} = require('gridvo-common-js');
const {tracer} = require('../../util');

const {DATA_COLLECT_SERVICE_HOST = "127.0.0.1", DATA_COLLECT_SERVICE_PORT = "3001"} = process.env;
class Gateway {
    constructor() {
        this._httpRequest = rest;
    }

    getDataSource(dataSourceID, traceContext, callback) {
        var url = `http://${DATA_COLLECT_SERVICE_HOST}:${DATA_COLLECT_SERVICE_PORT}/data-sources/${dataSourceID}`;
        var options = {
            method: "GET",
            path: url
        };
        let request = this._httpRequest.wrap(restZipkinInterceptor, {
            tracer,
            traceContext,
            serviceName: 'data-source-interaction',
            remoteServiceName: 'data-collect'
        }).wrap(mime);
        request(options).then(response=> {
            let {dataSource, errcode, errmsg} = response.entity;
            if (dataSource && errcode == "0" && errmsg == "ok") {
                callback(null, dataSource);
            }
            else {
                callback(null, null);
            }
        }).catch(err=> {
            callback(err);
        });
    }
}

module.exports = Gateway;