const mustache = require('mustache');

module.exports = function (RED) {
	function ImtApiCall(config) {
		RED.nodes.createNode(this, config);

		this.on('input', async (msg) => {
			const { method } = config;

			const query = new URLSearchParams();
			const endpoint = mustache.render(config.endpoint, msg);
			const connection = RED.nodes.getNode(config.connection);

			const options = {
				method,
				headers: {},
			};

			switch (config.payload) {
				case 'body':
					options.body = msg.payload;
					break;
				case 'query':
					Object.keys(msg.payload).forEach((k) => {
						const v = msg.payload[k];

						if (typeof v === 'string') {
							query.set(k, v);
						}
					});
					break;
			}

			options.headers['Content-Type'] = 'application/json';
			options.headers['Authorization'] =
				'Token ' + connection.credentials.apiKey;

			fetch(
				`${connection.baseUrl}/api/v2${endpoint}?${query.toString()}`,
				options,
			)
				.then(async (response) => {
					const payload = await response.json();

					payload.error
						? this.error(payload.error)
						: this.send({
								...msg,
								payload,
						  });
				})
				.catch((err) => {
					this.error(err);
				});
		});
	}

	function ImtConnection(config) {
		RED.nodes.createNode(this, config);

		this.baseUrl = config.baseUrl;
	}

	RED.nodes.registerType('make', ImtApiCall);
	RED.nodes.registerType('imt-connection', ImtConnection, {
		baseUrl: { type: 'text' },
		credentials: {
			apiKey: { type: 'password' },
		},
	});
};
