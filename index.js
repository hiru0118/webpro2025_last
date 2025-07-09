// index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World from Hitsuji Sennin!');
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました。`);
});