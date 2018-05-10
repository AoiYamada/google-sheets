const spreadsheetId = '1cEVGbJm3A8GGY4OpGrnpNDCQXs_rTWVZClECuDsCTzg';
const Spreadsheets = require('../index.js');
const credentials = {
    "installed": {
        "client_id": "195616641908-k7bf7tvfk970lpf3dk2q37rni56cadub.apps.googleusercontent.com",
        "project_id": "midyear-guild-198804",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "SczdqnZApf9Ow8MUYs0IdmZE",
        "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
    }
}

const sheets = new Spreadsheets({ spreadsheetId, credentials });
const sheet = sheets.get({
    sheet: '工作表2',
    range: 'A1:AL',
})

sheet
    .then(rows => console.log(rows))
    .catch(err => console.log(err));