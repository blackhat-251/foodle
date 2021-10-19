
const jwt  = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const User = require('../models/user')

async function jwt_verify(req, res, next) {
    const exceptions = ['/', '/login', '/register'];
    if(exceptions.includes(req.path)){
        return next();
    }
    try{
        var token = req.headers.cookie;

        if(!token){
            return res.redirect("/login");
        }

        token = token.split("jwt=")[1];
        await jwt.verify(token, JWT_SECRET, async (err, verifiedJwt) => {
            if(err){
                return res.redirect("/login");
            }else{
                const username = verifiedJwt["username"];
                req.user = await User.findOne({username});
            }
        })
    }catch(e){
        console.log(e);
        return res.redirect("/login");
    }
    return next();
};

module.exports = jwt_verify