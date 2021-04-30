const fs = require('fs');
const jwt = require('jsonwebtoken');

// use 'utf8' to get string instead of byte array  (512 bit key)
const privateKEY = fs.readFileSync('./private.key', 'utf8');
const publicKEY = fs.readFileSync('./public.key', 'utf8');

module.exports = {
    sign: (payload, options) => {
        // Token signing options
        let signOptions = {
            issuer: options.issuer,
            subject: options.subject,
            audience: options.audience,
            expiresIn: '12h',
            algorithm: 'RS256'
        };
        return jwt.sign(payload, privateKEY, signOptions);
    },
    verify: (token, options) => {
        // Token verify options
        let verifyOptions = {
            issuer: options.issuer,
            subject: options.subject,
            audience: options.audience,
            expiresIn: '12h',
            algorithm: ['RS256']
        };

        try {
            return jwt.verify(token, publicKEY, verifyOptions);
        } catch (err) {
            return false;
        }
    },
    decode: (token) => {
        return jwt.decode(token, {complete: true});
    }
}
