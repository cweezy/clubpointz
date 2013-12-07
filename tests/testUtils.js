describe('Utility function', function () {

  it('gets environment variables', function (done) {
    process.env.MOCK = 'mock';
    assert.equal('mock', util.getEnvVar('MOCK'));
    assert.equal(null, util.getEnvVar('NOTHING'));
    done();
  }),

  it('gets plural or singular form of word', function (done) {
    var inputLabels = ['cat', 'cup', 'dollar', 'bear'];
    var inputCounts = [25, 1, 0, 4];
    var expectedOutputs = ['cats', 'cup', 'dollars', 'bears'];
    _.each(inputLabels, function (label, i) {
      assert.equal(expectedOutputs[i], util.getSingularOrPlural(label, inputCounts[i]));
    });  
    done();
  }); 
});
