import ENVIRONMENT from "./config/environment.config.js";
import connectMongoDB from "./config/mongodb.config.js";
import dns from 'dns'
import express from 'express'
import authRouter from "./routes/auth.router.js";
import mailer_transport from "./config/mailer.config.js";
import workspaceRouter from "./routes/workspace.router.js";
import cors from 'cors'


if (ENVIRONMENT.MODE === 'delevopment'){
  dns.setServers(['8.8.8.8', '8.8.4.4'])
  console.log('Ejecutando en modo Dev, con DNS de Google');
}

// config express
const app = express()


app.use(express.json())

app.listen(ENVIRONMENT.PORT, ()=> {console.log(`Escuchando en el puerto: ${ENVIRONMENT.PORT}`)})

// se habilitan las consultas cross-origin
app.use(cors())

// conexion con la DB
connectMongoDB()


// routes
app.use('/api/auth', authRouter);
app.use('/api/workspace', workspaceRouter);


