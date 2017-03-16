'use strict';

function parseOriginalDataFromMqttData(mqttData) {
    let {topic, payload} = mqttData;
    let originalData = {};
    originalData.s = topic;
    let {v, t} = JSON.parse(payload);
    originalData.v = v;
    originalData.t = t;
    return originalData;
}

function parseDataSourceIDFromTopic(topic) {
    return topic.split("/").slice(2).slice(-1).join("-");
}

function parseActionFromTopic(topic) {
    return topic.split("/").slice(-1, -2)[0];
}

module.exports = {
    parseOriginalDataFromMqttData,
    parseDataSourceIDFromTopic,
    parseActionFromTopic
};