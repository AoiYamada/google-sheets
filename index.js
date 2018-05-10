const fs = require('fs');
const readline = require('readline');
const path = require('path');
const {
    google
} = require('googleapis');
const {
    OAuth2Client
} = require('google-auth-library');
const sheets = google.sheets('v4');

// more details on scopes:
// https://developers.google.com/sheets/api/guides/authorizing#AboutAuthorization
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(process.cwd(), '/.credentials/sheets.credential.json');

const sheetValues = sheets.spreadsheets.values;

class Spreadsheets {

    /**
     * @param {string} spreadsheetId - Spreadsheet id copied from google sheets.
     * @param {string||null} auth - Promise returned by Spreadsheets.auth.
     */
    constructor({
        spreadsheetId,
        credentials,
        token_path = TOKEN_PATH
    }, auth) {
        this.auth = auth || Spreadsheets.auth(credentials, token_path);
        this.spreadsheetId = spreadsheetId;
    }

    /**
     * @return {promise} - Promise of auth
     */
    static auth(credentials, token_path = TOKEN_PATH) {
        return authorize(credentials, token_path);
    }

    /**
     * @return {promise} - Promise of rows(A 2D array of data) 
     *                     from specific sheet and the given range.
     * @param {string} sheet - Sheet name.
     * @param {string} range - Range in the sheet in specific format like:
     *                         A1:AL
     *                         (for details, check documentation of googleapis)
     */
    get({
        sheet,
        range,
    }) {
        sheet = encodeURI(sheet);
        return new Promise(async(resolve, reject) => {
            try {
                let auth = await this.auth;
                sheetValues.get({
                    auth: auth,
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheet}!${range}`,
                }, (err, response) => {
                    if (err) reject(err);
                    else {
                        let rows = response.data.values;
                        resolve(rows);
                    }
                });
            } catch (err) {
                reject(err);
            };
        });
    }

    /**
     * Update the contents of specific sheet and range.
     * @return {???} - don't know, check google api.
     * @param {string} sheet - Sheet name.
     * @param {string} range - Range in the sheet in specific format like:
     *                         A1:AL
     *                         (for details, check documentation of googleapis)
     * @param {string} valueInputOption - Details: https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
     * @param {array} values - A 2D array of data to be wrote into the given range.
     */
    update({
        sheet,
        range,
        valueInputOption = 'RAW',
        values,
    }) {
        sheet = encodeURI(sheet);
        return new Promise(async(resolve, reject) => {
            try {
                let auth = await this.auth;
                sheetValues.update({
                    auth: auth,
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheet}!${range}`,
                    valueInputOption,
                    resource: {
                        values
                    }
                }, (err, result) => {
                    if (err) reject(err);
                    else
                        resolve(result);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

}

module.exports = Spreadsheets;

// helper(s), copy and edit from google examples:
// https://developers.google.com/sheets/api/quickstart/nodejs

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials, token_path) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    return new Promise((resolve, reject) => {
        fs.readFile(token_path, async(err, token) => {
            if (err) {
                try {
                    const new_oauth2Client = await getNewToken(oauth2Client, token_path);
                    resolve(new_oauth2Client);
                } catch (err) {
                    reject(err);
                }
            } else {
                oauth2Client.credentials = JSON.parse(token);
                resolve(oauth2Client);
            }
        });
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google-auth-library.Oauth2Client} oauth2Client The OAuth2 client to get token for.
 */
function getNewToken(oauth2Client, token_path) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oauth2Client.getToken(code, (err, token) => {
                if (err) reject(`Error while trying to retrieve access token ${err}`);
                else {
                    oauth2Client.credentials = token;
                    storeToken(token, token_path);
                    resolve(oauth2Client);
                }
            });
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 * @param {Object} token The token to store to disk.
 */
function storeToken(token, token_path) {
    const token_dir = path.dirname(token_path);
    try {
        fs.mkdirSync(token_dir);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFileSync(token_path, JSON.stringify(token));
    console.log('Token stored to ' + token_path);
}