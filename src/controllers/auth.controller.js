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

      const frontendUrl = ENVIRONMENT.URL_FRONTEND || ENVIRONMENT.URL_BACKEND

      await mailer_transport.sendMail({
        from: ENVIRONMENT.GMAIL_USERNAME,
        to: email,
        subject: "Verifica tu email",
        html: `
                <h1>Bienvenido!</h1>
                <p>Para verificar tu cuenta, haz click en el siguiente enlace:</p>
                <a href='${frontendUrl}/verify?verification_token=${verification_token}'>Click aqui</a> para verificar correo
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

      const user_verify = await userRepository.updateById(user._id, { email_verify: true })

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

  async resetPasswordRequest(req, res){
    try {
      const { email } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ServerError('Email invalido', 400)
      }

      const user_found = await userRepository.getByEmail(email);
      if (!user_found) {
        throw new ServerError(`Usuario con email ${email} no encontrado`, 404)
      }

      const reset_token = jwt.sign({ email: user_found.email }, ENVIRONMENT.JWT_SECRET, {expiresIn: '1h'})

      const frontendUrl = ENVIRONMENT.URL_FRONTEND || ENVIRONMENT.URL_BACKEND

      await mailer_transport.sendMail({
        from: ENVIRONMENT.GMAIL_USERNAME,
        to: email,
        subject: 'Solicitud de restablecimiento de contraseña',
        html: `
          <h1>Restablecer contraseña</h1>
          <p>Para restablecer tu contraseña, haz click en el siguiente enlace:</p>
          <a href='${frontendUrl}/reset-password-confirm?token=${reset_token}'>Restablecer contraseña</a>
        `
      })

      return res.status(200).json({
        ok: true,
        message: 'Solicitud de restablecimiento enviada',
        status: 200,
        data: {
          user: {
            email: user_found.email
          }
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

  async resetPasswordConfirm(req, res){
    try {
      const { new_password } = req.body;
      const auth_header = req.headers.authorization;

      if (!auth_header) {
        throw new ServerError('No hay header de autorizacion', 401)
      }

      const token_value = auth_header.split(' ')[1]

      if (!new_password || new_password.length < 6) {
        throw new ServerError('Contraseña debe tener al menos 6 caracteres', 400)
      }

      const payload = jwt.verify(token_value, ENVIRONMENT.JWT_SECRET)

      const { email } = payload;

      const user_found = await userRepository.getByEmail(email);
      if (!user_found) {
        throw new ServerError(`Usuario con email ${email} no encontrado`, 404)
      }

      const hashed_password = await bcrypt.hash(new_password, 12);

      await userRepository.updateById(user_found._id, { password: hashed_password });

      return res.status(200).json({
        ok: true,
        message: 'Contraseña actualizada exitosamente',
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
}

const authController = new AuthController();

export default authController;