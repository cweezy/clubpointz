/**
 * Gruntfile
 */

var fs = require('fs');
var path = require('path');
var Mocha = require('mocha');

var SCRAPER_FILE_DIR = 'tasks/scraper';


module.exports = function (grunt) {

  grunt.registerTask('scrape', "Scrapes recent race results", function (args) {
    var quietReporter = require('./' + path.join(SCRAPER_FILE_DIR, 'quietReporter')).quietReporter;

    if (args === 'from_file') {
      var file = fs.readFileSync(path.join(SCRAPER_FILE_DIR, 'races.json'));
      process.env['RACES'] = file;
    }
    var done = this.async();
    var mocha = new Mocha({
      reporter: quietReporter,
      timeout: 99999999
    });
    mocha.addFile(path.join(SCRAPER_FILE_DIR, 'scraper.js'));
    mocha.run(function (failures) {
      done();
    });
  });
};
