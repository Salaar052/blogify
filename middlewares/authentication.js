const { validateToken } = require("../services/authentication");

function checkAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const cookieValue = req.cookies[cookieName];
        if (!cookieValue) {
            return next();   // return so it doesn’t fall through
        }

        try {
            const userPayload = validateToken(cookieValue);
            req.user = userPayload;
        } catch (error) {
            // invalid token, just ignore
        }
        return next();
    };
}
    

module.exports = {
    checkAuthenticationCookie,
}