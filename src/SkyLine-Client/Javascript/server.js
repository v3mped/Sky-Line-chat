const express = require('express');
const path = require('path');
const app = express();

// CodeHS environment provides its own port dynamically
const PORT = process.env.PORT || 3000;

// Targets your sibling directory folder for asset delivery
const frontendPath = path.join(__dirname, '..', 'Html&Css');
app.use(express.static(frontendPath));

// Deliver the entry point HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Skyline-Chat running on CodeHS development server`);
});
