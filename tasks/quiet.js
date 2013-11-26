function quiet(runner) {
  var failures = 0;

  runner.on('fail', function(test, err){
    failures++;
    console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
  });

  runner.on('end', function(){
    process.exit(failures);
  });
}

exports.reporter = quiet;
