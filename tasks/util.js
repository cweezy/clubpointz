exports.getEnvVar = function (key) {
  if (process.env[key]) {
    return process.env[key];
  }
},

exports.getSingularOrPlural = function (label, count) {
  return count === 0 || count > 1 ? label + 's' : label;
};
