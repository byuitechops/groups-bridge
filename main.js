/* Module Description 

    Reads the group structure from d2l using d2l's api
    Creates the groups in the canvas class, using canvas's api 
*/

/* Put dependencies here */
const async = require('async')
const fs = require('fs')
var request = require('request')
const { URL } = require('url')
var cookies = [
    'd2lSessionVal=QbAJFTrPfZKs5zo1PbRRuOp8M;',
    'd2lSecureSessionVal=M76AlKC0PV6Xz3NDzIuBeiChM;',
]

/* Include this line only if you are going to use Canvas API */
//const canvas = require('canvas-wrapper');

/* View available course object functions */
// https://github.com/byuitechops/d2l-to-canvas-conversion-tool/blob/master/documentation/classFunctions.md

function addCookies(cookies) {
    var j = request.jar();
    cookies.forEach(c => j.setCookie(request.cookie(c), 'https://byui.brightspace.com/'))
    request = request.defaults({
        jar: j
    })
}

function D2LGET(url) {
    var url = new URL(url, 'https://byui.brightspace.com/').href
    return new Promise((resolve,reject) => {
        request.get(url, function (err, res, body) {
            if (err) return reject(err)
            try {
                // For some reason the json parse dosen't work
                var data = JSON.parse(body)
                resolve(data)
            } catch (e) {
                try {
                    // So when that fails i'm cheating and using eval
                    var data = eval(body)
                    resolve(data)

                } catch(e){
                    reject(e)
                }
            }
        })
    })
}

async function getCatagories(ou, version) {
    // Shortening our urls a little bit
    var tag = `/d2l/api/lp/${version || "1.20"}/${ou}`

    // Getting every group catagory
    var catagories = await D2LGET(`${tag}/groupcategories/`)
    for(var i = 0; i < catagories.length; i++){
        var url = `${tag}/groupcategories/${catagories[i].GroupCategoryId}/groups/`
        catagories[i].Groups = await D2LGET(url)
    }
    return catagories
}


async function main(){
    addCookies(cookies)
    var groups = await getCatagories(237861,"1.20")
    fs.writeFileSync('groups.json',JSON.stringify(groups))
}

main()


//module.exports = (course, stepCallback) => {
//    /* Create the module report so that we can access it later as needed.
//    This MUST be done at the beginning of each child module. */
//    course.addModuleReport('moduleName');
//
//    /* Used to log successful actions */
//    course.success('moduleName', 'moduleName successfully ...');
//
//    /* How to report an error (Replace "moduleName") */
//    // course.throwErr('moduleName', e);
//
//    /* You should never call the stepCallback with an error. We want the
//    whole program to run when testing so we can catch all existing errors */
//
//    stepCallback(null, course);
//};
