'use strict';
const pomelo = require('pomelo');
const {createZipkinFilter} = require('gridvo-common-js');
const {logger, tracer} = require('../util');

let app = pomelo.createApp();
app.set('name', 'data-source-interaction');
app.configure('production|development', 'dataSourceConnector', () => {
    app.set('connectorConfig',
        {
            connector: pomelo.connectors.mqttconnector,
            publishRoute: 'dataSourceConnector.mqttHandler.publish',
            subscribeRoute: 'dataSourceConnector.mqttHandler.subscribe'
        });
    app.filter(createZipkinFilter({tracer, serviceName: "data-source-interaction"}));
    app.set('errorHandler', (err, msg, resp, session, next) => {
        logger.error(err.message);
    });
});

app.start((err) => {
    if (err) {
        logger.error(`${err.message}`);
    }
    else {
        logger.info("pomelo app is start");
    }
});

process.on('uncaughtException', err => {
    logger.error(`Caught exception: ${err.stack}`);
});