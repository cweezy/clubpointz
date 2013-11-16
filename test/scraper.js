var Browser = require('zombie');
var assert = require('assert');
var fs = require('fs');
var path = require('path');

var TEMP_DATA_DIR = 'temp';
var TEMP_DATA_FILE = 'temp.json';

var browser = new Browser();

describe('Google', function () {
    it('get title text', function (done) {
        var URL = 'http://www.google.com';
        console.log('visiting ' + URL);
        browser.visit(URL, function () {
            var obj = { 'name' : browser.text('title') };
            fs.mkdir(TEMP_DATA_DIR, function (err) {
                // handle err
            });
            fs.writeFileSync(TEMP_DATA_DIR + path.sep + TEMP_DATA_FILE, JSON.stringify(obj)); 
            done();
        })
    });;
});
