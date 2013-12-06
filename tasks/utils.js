var utils = {

    getEnvVar : function (key) {
        if (process.env[key]) {
            return process.env[key];
        }
    }
};

exports.utils = utils;
