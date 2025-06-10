const express = require('express');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use(logger);

// Routes
app.use('/api/products', productRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const validateProduct = require('../middleware/validateProduct');

let products = [];

router.get('/', (req, res) => {
  let filtered = [...products];

  if (req.query.search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(req.query.search.toLowerCase())
    );
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  res.json(filtered.slice(start, end));
});

router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).send('Product not found');
  res.json(product);
});

router.post('/', authenticate, validateProduct, (req, res) => {
  const newProduct = { id: Date.now().toString(), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

router.put('/:id', authenticate, validateProduct, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).send('Product not found');
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

router.delete('/:id', authenticate, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).send('Product not found');
  const deleted = products.splice(index, 1);
  res.json(deleted[0]);
});

module.exports = router;


// middleware/logger.js
module.exports = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};


// middleware/auth.js
module.exports = (req, res, next) => {
  if (req.headers.token === '12345') {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};


// middleware/validateProduct.js
module.exports = (req, res, next) => {
  const { name, price } = req.body;
  if (!name || typeof price !== 'number') {
    return res.status(400).send('Invalid product');
  }
  next();
};


// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
};
