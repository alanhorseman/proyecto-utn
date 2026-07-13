import ServerError from "../helpers/serverError.helper.js";
import userRepository from "../repositories/user.repository.js";
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcrypt'
import mailer_transport from "../config/mailer.config.js";
import ENVIRONMENT from "../config/environment.config.js";
import jwt from 'jsonwebtoken';

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || name.length <= 2) {
        throw new ServerError('Nombre debe ser mayor a 2 caracters', 400)
      }

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new ServerError('El nombre no puede contener caracteres especiales', 400)
      }

      if (!password || password.length < 6) {
        throw new ServerError('Password debe tener al menos 6 caracteres', 400)
      }

      const userExists = await userRepository.getByEmail(email)
      if (userExists) {
        throw new ServerError('El email ya existe', 400)
      }

      const hashed_password = await bcrypt.hash(password, 12)

      const new_user = await userRepository.create(name, email, hashed_password)

      const verification_token = jwt.sign({ email: email }, ENVIRONMENT.JWT_SECRET)

      await mailer_transport.sendMail({
        from: email,
        to: ENVIRONMENT.GMAIL_USERNAME,
        subject: "Verifica tu email",
        html: `
                <h1>Bienvenido!</h1>
                <a href='${ENVIRONMENT.URL_BACKEND}/api/auth/verify-email?verification_token=${verification_token}'>Click aqui</a> para verificar para verificar la cuenta
            `
      })

      res.status(201).json({
        ok: true,
        message: 'Usuario creado',
        status: 201,
        data: {
          user: {
            id: uuid(),
            name: new_user.nombre,
            email: new_user.email
          }
        }
      })
    } catch (error) {
      
      if (error instanceof ServerError) {
        return res.status(error.status).json({
          ok: false,
          message: error.message,
          status: error.status
        })
      }
      else {
        return res.status(500).json({
          ok: false,
          message: "Internal Server Error",
          status: 500
        });
      }
    }
  }

  async verifyEmail(req, res) {
    try {
      const { verification_token } = req.query

      if (!verification_token) {
        throw new ServerError('Falta el token de verificacion', 400)
      }

      const payload = jwt.verify(verification_token, ENVIRONMENT.JWT_SECRET)
      const { email } = payload

      const user = await userRepository.getByEmail(email)

      if (!user) {
        throw new ServerError(`Usuario con email ${email} no encontrado`, 400)
      }

      if (user.email_verify === true) {
        throw new ServerError('Email ya verificado', 400)
      }

      const user_verify = await userRepository.updateById(user.id, { email_verify: true })

      return res.status(200).json({
        ok: true,
        message: 'Email verificado',
        status: 200
      })

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError || error instanceof jwt.NotBeforeError) {
        return res.status(401).json({
          ok: false,
          message: 'Token invalido o expirado',
          status: 401
        })
      } else if (error instanceof ServerError) {
        return res.status(error.status).json({
          ok: false,
          message: error.message,
          status: error.status
        })
      } else {
        return res.status(500).json({
          ok: false,
          message: "Internal Server Error",
          status: 500
        });
      }
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new ServerError('El nombre no puede contener caracteres especiales', 400)
      }

      if (!password || password.length < 6) {
        throw new ServerError('Password invalida', 400)
      }

      const user_found = await userRepository.getByEmail(email);

      if(!user_found){
        throw new ServerError("usuario no registrado", 404)
      }

      if(!user_found.email_verify){
        throw new ServerError("Usuario con email no verificado", 401)
      }

      const is_correct_pass = await bcrypt.compare(password, user_found.password)

      if(!is_correct_pass){
        throw new ServerError('Credenciales invalidas', 401)
      }

      const profile_info = {
        nombre: user_found.nombre,
        email: user_found.email,
        id: user_found._id,
        fecha_creacion: user_found.fecha_creacion
      }

      const access_token = jwt.sign(profile_info, ENVIRONMENT.JWT_SECRET)

      return res.status(200).json({
        ok: true,
        status: 200,
        message: 'Usuario autenticado',
        data: {
          access_token
        }
      })

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError || error instanceof jwt.NotBeforeError) {
        return res.status(401).json({
          ok: false,
          message: 'Token invalido o expirado',
          status: 401
        })
      } if (error instanceof ServerError) {
        return res.status(error.status).json({
          ok: false,
          message: error.message,
          status: error.status
        })
      } else {
        return res.status(500).json({
          ok: false,
          message: "Internal Server Error",
          status: 500
        });
      }
    }
  }
}

const authController = new AuthController();

export default authController;