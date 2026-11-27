// api/_server.js
import 'dotenv/config';
import app from './index.js';

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Local API running at http://localhost:${PORT}`);
});