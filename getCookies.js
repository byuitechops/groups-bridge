/* eslint-env es6 */

const puppeteer = require('puppeteer');

async function getCookies(userData) {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.goto(`https://${userData.domain}.brightspace.com/d2l/login?noredirect=true`);
    await page.type('#userName', userData.username);
    await page.type('#password', userData.password);
    await Promise.all([
        page.waitForNavigation({
            waitUntil: 'networkidle0'
        }),
        page.click('[primary]'),
    ]);
    const cookies = await page.cookies();
    await browser.close();
    return cookies;
}



function getCredentials() {
    return new Promise((resolve, reject) => {
        var userInfo = {
            username: 'cct_danverde',
            password: process.env.PASSWRD, //TODO replace these
            domain: 'byui'
        };
        resolve(userInfo);
    });
}

// WORKING! :D

getCredentials()
    .then(getCookies)
// getCookies(userInfo)
    .then((cookies)=> {
        console.log(cookies);
    });