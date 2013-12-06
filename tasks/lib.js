var lib = {

    getEnvVar : function (key) {
        if (process.env[key]) {
            return process.env[key];
        }
    }
};

exports.lib = lib;
