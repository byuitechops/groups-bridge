/* eslint-env es6 */

const puppeteer = require('puppeteer');
const Enquirer = require('enquirer');
var enquirer = new Enquirer();
enquirer.register('password', require('prompt-password'));

/* User Username */
enquirer.question('username', 'Username:', {
    errorMessage: 'Cannot be blank!',
    validate: (input) => {
        return input != '';
    }
});

/* User Password */
enquirer.question('password', {
    type: 'password',
    message: 'Password:',
    errorMessage: 'Cannot be blank!',
    validate: (input) => {
        return input != '';
    }
});

module.exports = (course, childCb) => {

    async function getCookies(userData) {
        course.message('Getting Cookies');
        const browser = await puppeteer.launch({
            headless: true
        });
        try {
            const page = await browser.newPage();
            await page.goto(`https://${course.settings.domain}.brightspace.com/d2l/login?noredirect=true`);
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
        } catch (puppeteerErr) {
            await browser.close();
            return;
        }
    }


    

    new Promise(res => {
        if (course.info.username == undefined || course.info.password == undefined) {
            res(enquirer.ask());
        } else {
            res({username: course.info.username, password: course.info.password});
        }
    })
    // enquirer.ask()
        .then(getCookies)
        .then((cookies) => {
            childCb(null, cookies);
        })
        .catch((err) => {
            childCb(err);
        });
};