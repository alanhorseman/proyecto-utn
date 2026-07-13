import ENVIRONMENT from "../config/environment.config.js";
import ServerError from "../helpers/serverError.helper.js";
import jwt from 'jsonwebtoken'

function authMiddleware(req, res, next){
  try {
    
    const auth_header = req.headers.authorization
    if(!auth_header){
      throw new ServerError('No hay header de auth', 401)
    }

    const auth_token = auth_header.split(' ')[1]
    if(!auth_token){
      throw new ServerError('No hay token de auth', 401)
    }

    const user_info = jwt.verify(auth_token, ENVIRONMENT.JWT_SECRET)
    req.user = user_info

    return next()

  } catch (error) {
    if(error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError){
      return res.status(401).json({
        ok: false,
        status: 401,
        message: 'Token expirado o invalido'
      })
    } else if (error instanceof ServerError) {
      return res.status(error.status).json({
        ok: false,
        status: error.status,
        message: error.message
      })
    } else {
      return res.status(500).json({
        ok: false,
        status: 500,
        message: "Internal Server Error"
      });
    }
  }
}

export default authMiddleware