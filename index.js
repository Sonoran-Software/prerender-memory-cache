var cacheManager = require('cache-manager');

module.exports = {
	init: function() {
		this.cache = cacheManager.caching({
			store: 'memory', max: process.env.CACHE_MAXSIZE || 100, ttl: process.env.CACHE_TTL || 60/*seconds*/
		});
	},

	// Use renderType from query params to differentiate cache keys (otherwise we return the same content for different render types)
	getCacheKey: function(req) {
		return req.prerender.url + '-' + (req.query.renderType || 'default');
	},

	requestReceived: function(req, res, next) {
		var key = this.getCacheKey(req);
		this.cache.get(key, function (err, result) {
			if (!err && result) {
				req.prerender.cacheHit = true;
				res.send(200, result);
			} else {
				next();
			}
		});
	},

	beforeSend: function(req, res, next) {
		if (!req.prerender.cacheHit && req.prerender.statusCode == 200) {
			var key = this.getCacheKey(req);
			this.cache.set(key, req.prerender.content);
		}
		next();
	}
};