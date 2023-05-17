require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const usersRouter = require('./routes/users');

const app = express();

// Configurar CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected!'))
  .catch((error) => console.error('MongoDB connection error:', error));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.post('/users',
  [    check('name').notEmpty().withMessage('El nombre es obligatorio'),    check('email').isEmail().withMessage('Debe ingresar un correo electrónico válido'),    check('password').isLength({ min: 2 }).withMessage('La contraseña debe tener al menos 8 caracteres')  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(422).send(`
        <div style="background-color: #ffe4e1; padding: 20px;">
          <h3 style="color: #bf4f4f;">Errores de validación:</h3>
          <ul style="list-style: none; color: #bf4f4f; margin: 0; padding: 0;">
            ${errorMessages.map(message => `<li>${message}</li>`).join('')}
          </ul>
          <button onclick="window.history.back()" style="background-color: #bf4f4f; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; cursor: pointer;">Volver</button>
        </div>
      `);
    }
    next();
  }
);



// Middleware para encriptar la contraseña antes de guardarla en la base de datos
app.use('/users', async (req, res, next) => {
  try {
    if (req.method === 'POST') {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      req.body.password = hashedPassword;
    }
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.redirect('/users');
});

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
