/**
 * A mocha reporter that logs nothing but test failures.
 */

function reporter(runner) {
  var failures = 0;

  runner.on('fail', function(test, err){
    failures++;
    console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
  });

  runner.on('end', function(){
    process.exit(failures);
  });
}

exports.quietReporter = reporter;
