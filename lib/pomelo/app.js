'use strict';
const pomelo = require('pomelo');
const {createZipkinComponent, createZipkinFilter} = require('gridvo-common-js');
const {logger, tracer} = require('../util');

let app = pomelo.createApp();

app.set('name', 'data-source-interaction');

let {ZOOKEEPER_SERVICE_HOST = "127.0.0.1", ZOOKEEPER_SERVICE_PORT = "2181"} = process.env;
app.configure('production|development', ()=> {
    app.set("monitorConfig",
        {
            monitor: pomelo.monitors.zookeepermonitor,
            servers: `${ZOOKEEPER_SERVICE_HOST}:${ZOOKEEPER_SERVICE_PORT}`
        });
});

app.configure('production|development', 'dataSourceConnector', ()=> {
    app.set('connectorConfig',
        {
            connector: pomelo.connectors.mqttconnector,
            publishRoute: 'dataSourceConnector.mqttHandler.publish',
            subscribeRoute: 'dataSourceConnector.mqttHandler.subscribe'
        });
    app.load(createZipkinComponent, {tracer, serviceName: "data-source-interaction"});
    app.filter(createZipkinFilter(app));
});

app.start((err)=> {
    if (err) {
        logger.error(`${err.message}`);
    }
    else {
        logger.info("pomelo app is start");
    }
});

process.on('uncaughtException', err=> {
    logger.error(`Caught exception: ${err.stack}`);
});