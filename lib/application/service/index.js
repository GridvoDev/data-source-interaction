'use strict';
const DataService = require('./dataService');

let dataService = null;
function createDataService(single = true) {
    if (single && dataService) {
        return dataService;
    }
    dataService = new DataService();
    return dataService;
};

module.exports = {
    createDataService
};