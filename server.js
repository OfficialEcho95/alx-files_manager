const express = require('express');
const routes = require('./routes/index');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/', routes);

app.listen(PORT, hostname = '127.0.0.1', () => {
  console.log(`Server is running on port ${PORT}`);
});
