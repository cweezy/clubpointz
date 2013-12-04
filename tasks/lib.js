var lib = {

    getEnvVar : function (key) {
        if (process.env[key]) {
            return process.env[key];
        }
        // TODO throw error
        console.log('WARNING: no environment variable ' + key);
    }
};

exports.lib = lib;
