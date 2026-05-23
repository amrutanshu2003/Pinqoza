const jwt = require('jsonwebtoken');
const AdminUser = require('../../models/admin/AdminUser');

const JWT_SECRET = process.env.JWT_ADMIN_SECRET;
if (!JWT_SECRET) {
  throw new Error('Missing JWT_ADMIN_SECRET environment variable');
}

// Protect route - verify admin token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = await AdminUser.findById(decoded.id).select('-password');
      
      if (!req.admin) {
        return res.status(401).json({ message: 'Admin not found' });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Generate admin JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

module.exports = { protect, generateToken, JWT_SECRET };
