'use strict';

function parseDataSourceIDFromTopic(topic) {
    let strings = topic.split("/").slice(2);
    strings.pop();
    return strings.join("-");
}

function parseActionFromTopic(topic) {
    return topic.split("/").slice(-1)[0];
}

function parseOriginalDataFromMqttData(mqttData) {
    let {topic, payload} = mqttData;
    let originalData = {};
    originalData.s = parseDataSourceIDFromTopic(topic);
    let {v, t} = JSON.parse(payload);
    originalData.v = v;
    originalData.t = t;
    return originalData;
}

function parseConfigUpdateResultFromMqttData(mqttData) {
    let {topic, payload} = mqttData;
    let updateResult = {};
    updateResult.s = parseDataSourceIDFromTopic(topic);
    let {v, t} = JSON.parse(payload);
    updateResult.v = v;
    updateResult.t = t;
    return updateResult;
}

function parseDataSourceConfigMqttTopicFromKafka(dataSourceConfigTopicMessage) {
    let {dataSourceID} = dataSourceConfigTopicMessage;
    let mqttTopic = `/rt/${dataSourceID.replace(/-/g, "/")}/config`;
    return mqttTopic;
}

module.exports = {
    parseOriginalDataFromMqttData,
    parseDataSourceIDFromTopic,
    parseActionFromTopic,
    parseConfigUpdateResultFromMqttData,
    parseDataSourceConfigMqttTopicFromKafka
};