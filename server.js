/**
 * Server entry point — boots the Express app on port 5000.
 */
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Task API listening on http://localhost:${PORT}`);
});
