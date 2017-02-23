const mqtt = require('mqtt');

let client = mqtt.connect('mqtt://10.0.3.31:3011');

client.on('connect', () => {
    let payload = JSON.stringify({
        v: 100,
        t: (new Date()).getTime()
    });
    client.publish('NWHSDZ-YL', payload);
});

client.on('message', (topic, message) => {
    console.log(topic.toString());
    console.log(message.toString());
});

client.on('close', () => {
    console.log("is close");
    client.end();
});