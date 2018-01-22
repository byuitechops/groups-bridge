







async function getCatagories(ou, version) {
    version = version || "1.20"
    xhr = new XHR()
    var cats = await xhr.get(`/d2l/api/lp/${version}/${ou}/groupcategories/`)
    console.log(cats)
}


/* Module Description 

    Reads the group structure from d2l using d2l's api
    Creates the groups in the canvas class, using canvas's api 
*/

/* Put dependencies here */
var request = require('request')
var cookies = [
    'd2lSessionVal=bqYqh03mt9Vfd6HeN12WCXXBx;',
    'd2lSecureSessionVal=tagNJRUG3qkzBxwZzgJEPg0cR;',
]

/* Include this line only if you are going to use Canvas API */
 const canvas = require('canvas-wrapper');

/* View available course object functions */
// https://github.com/byuitechops/d2l-to-canvas-conversion-tool/blob/master/documentation/classFunctions.md

function addCookies(cookies){
    var j = request.jar();
    cookies.forEach(c => j.setCookie(request.cookie(c),'https://byui.brightspace.com/'))
    request = request.defaults({jar:j})
}

function D2L(url,cb){
    request.get(url,function(err,res,body){
        if(err) return cb(err)
        cb(null,body)
    })
}
module.exports = (course, stepCallback) => {
    /* Create the module report so that we can access it later as needed.
    This MUST be done at the beginning of each child module. */
    course.addModuleReport('moduleName');

    /* Used to log successful actions */
    course.success('moduleName', 'moduleName successfully ...');

    /* How to report an error (Replace "moduleName") */
    // course.throwErr('moduleName', e);

    /* You should never call the stepCallback with an error. We want the
    whole program to run when testing so we can catch all existing errors */

    stepCallback(null, course);
};
