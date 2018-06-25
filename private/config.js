/**
 * config.js
 *
 * Edit each of these configuration settings as you like.
 */

var crypto = require('crypto');

module.exports = {
	/** Recommended customization **/

	DB_PATH: 'mongodb://localhost:27017/local',
	PORT: 3000,
	DEFAULT_USER_PASSWORD: 1234,

	// Bringg specific
	ACCESS_TOKEN: 'ZtWsDxzfTTkGnnsjp8yC',
	SECRET_KEY: 'V_-es-3JD82YyiNdzot7',

	/** Recommend that you leave these configuration settings **/

	SESSION_SECRET_KEYS: [
        crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex'),
        crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')
    ],
}
