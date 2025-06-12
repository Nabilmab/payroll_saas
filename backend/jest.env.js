// This file's only purpose is to load environment variables for Jest
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
