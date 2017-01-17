'use strict';
const {createMessageProducer} = require("./message");
const {createDataCollectServiceGateway} = require("./serviceGateway");

module.exports = {
    createDataCollectServiceGateway,
    createMessageProducer
};