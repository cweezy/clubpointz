/**
 * Gruntfile
 */

var fs = require('fs');
var Mocha = require('mocha');
var quiet = require('./tasks/quiet');

module.exports = function (grunt) {

  grunt.registerTask('scrape', "Scrapes recent race results", function (args) {
    if (args === 'from_file') {
      var file = fs.readFileSync('tasks/races.json');
      process.env['RACES'] = file;
    }
    var done = this.async();
    var mocha = new Mocha({
      reporter: quiet.reporter,
      timeout: 99999999
    });
    mocha.addFile('tasks/scraper.js');
    mocha.run(function (failures) {
      done();
    });
  });
};
