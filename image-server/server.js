const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));

app.get('/', (req, res) => {
  const fs = require('fs');
  const imagesDir = path.join(__dirname, 'images');
  const files = fs.existsSync(imagesDir)
    ? fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
    : [];

  const list = files
    .map(f => `<li><a href="/images/${f}">/images/${f}</a></li>`)
    .join('');

  res.send(`
    <h1>Image Server</h1>
    <p>Base URL: http://localhost:${PORT}/images/</p>
    <ul>${list || '<li>画像がまだありません</li>'}</ul>
  `);
});

app.listen(PORT, () => {
  console.log(`Image server running at http://localhost:${PORT}`);
});
