'use strict';
const HttpDataCollectServiceGateway = require('./httpDataCollectServiceGateway');

let gateway = null;
function createDataCollectServiceGateway(single = true) {
    if (single && gateway) {
        return gateway;
    }
    gateway = new HttpDataCollectServiceGateway();
    return gateway;
};

module.exports = {
    createDataCollectServiceGateway
};