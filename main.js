/* Module Description 

    Reads the group structure from d2l using d2l's api
    Creates the groups in the canvas class, using canvas's api 
*/

/* Put dependencies here */
var request = require('request')
const async = require('async')
const {
    URL
} = require('url')
var cookies = [
    'd2lSessionVal=bqYqh03mt9Vfd6HeN12WCXXBx;',
    'd2lSecureSessionVal=tagNJRUG3qkzBxwZzgJEPg0cR;',
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

function D2LGET(url, cb) {
    var url = new URL(url, 'https://byui.brightspace.com/').href
    request.get(url, function (err, res, body) {
        if (err) return cb(err)
        try {
            console.log(body)
            var data = JSON.parse(body)
            
            cb(null, data)
        } catch (e) {
            cb(e)
        }
    })
}


async function getCatagories(ou, version, cb) {
    // Shortening our urls a little bit
    var tag = `/d2l/api/lp/${version || "1.20"}/${ou}`

    // Getting every group catagory
    D2LGET(`${tag}/groupcategories/`, function (err, data) {
        if (err) return cb(err)
        
        // For each catagory
        async.map(data, function (catagory, catagoryCB) {
            // still too long so it gets its own variables
            var url = `${tag}/groupcategories/${catagory.GroupCategoryId}/groups`
            // Get more details about the groups
            D2LGET(url, function (err, data) {
                if (err) return catagoryCB(err)
                
                // overwritting the list of numbers
                catagory.Groups = data
                // return our improved
                catagoryCB(null,catagory)
            })
        },function(err,categories){
            if(err) return cb(err)
            
            // returning
            cb(null,categories)  
        })
    })
}

addCookies(cookies)
getCatagories(10011,"1.20",console.log)

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
