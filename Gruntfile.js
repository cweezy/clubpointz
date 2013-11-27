/**
 * Gruntfile
 */

var fs = require('fs');
var path = require('path');
var Mocha = require('mocha');

var SCRAPER_FILE_DIR = 'tasks/scraper';


module.exports = function (grunt) {

  grunt.registerTask('scrape', "Scrapes recent race results", function (arg1, arg2) {
    var args = [arg1, arg2].join(',');
    var quietReporter = require('./' + path.join(SCRAPER_FILE_DIR, 'quietReporter')).quietReporter;

    if (args.indexOf('from_file') !== -1) {
      var file = fs.readFileSync(path.join(SCRAPER_FILE_DIR, 'races.json'));
      process.env['RACES'] = file;
    }

    if (args.indexOf('max_results') !== -1) {
      var maxResults = args.match(/max_results=([0-9]+)(,|$)/)[1];
      process.env['MAX_RESULTS'] = maxResults;
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
