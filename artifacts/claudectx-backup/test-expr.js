const express = require('express');
const app = express();
const path = require('path');
const p = path.resolve('/home/max/.npm-global/lib/node_modules/memctx/dashboard/dist/index.html');
app.get('/test', (req, res) => res.sendFile(p));
app.listen(9998, () => console.log('Listening on 9998'));
