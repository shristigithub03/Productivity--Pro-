const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

let quotes = [];

app.use(express.static('public'));
app.use(bodyParser.json());

fs.readFile('quotes.json', 'utf8', (err, data) => {
  if (!err && data) quotes = JSON.parse(data);
});

app.get('/quote', (req, res) => {
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  res.json(random || "No quotes yet!");
});

app.post('/add', (req, res) => {
  const newQuote = req.body.quote;
  quotes.push(newQuote);
  fs.writeFile('quotes.json', JSON.stringify(quotes, null, 2), () => {});
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
