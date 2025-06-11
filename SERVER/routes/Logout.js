import express from 'express';
const router = express.Router();

// POST /logout
router.post('/', (req, res) => {
  const timestamp = new Date().toLocaleString();
  console.log(`👤 User logout at ${timestamp}`);

  return res.status(200).json({
    status: 'success',
    message: 'User logged out successfully at ' + timestamp
  });
});

export default router;
