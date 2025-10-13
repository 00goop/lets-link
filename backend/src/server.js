import app from './app.js';
import { PORT } from './config.js';

app.listen(PORT, () => {
  console.log(`Let's Link API listening on port ${PORT}`);
});
