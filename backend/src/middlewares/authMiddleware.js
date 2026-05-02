const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    let token = req.cookies.token?.replace(/"/g, "").trim();
    if(!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY.trim());
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = { authMiddleware };