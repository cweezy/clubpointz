var Browser = require("zombie");
var assert = require('assert');

var browser = new Browser();

describe('Google', function () {
    it('get title text', function (done) {
        browser.visit('http://www.google.com/', function () {
            assert.equal('Google', browser.text('title'));
            done();
        })
    });;
});
