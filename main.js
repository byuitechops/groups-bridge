/* Module Description 

    Reads the group structure from d2l using d2l's api
    Creates the groups in the canvas class, using canvas's api 
*/

/* Put dependencies here */
const async = require('async');
const { URL } = require('url');
var request = require('request');
var course;

/* Include this line only if you are going to use Canvas API */
const canvas = require('canvas-wrapper');

/* View available course object functions */
// https://github.com/byuitechops/d2l-to-canvas-conversion-tool/blob/master/documentation/classFunctions.md

function addCookies(subdomain,cookies) {
    var j = request.jar();
    cookies.forEach(c => j.setCookie(request.cookie(c), `https://${subdomain}.brightspace.com/`));
    request = request.defaults({
        jar: j
    });
}

function D2LGET(subdomain,url,cb) {
    url = new URL(url,`https://${subdomain}.brightspace.com/`).href;
    course.message(`Making a request to ${url}`);
    request.get(url, function (err, res, body) {
        console.log(res.statusCode,body);
        if (err) return cb(err);
        if (res.statusCode != 200){
            return cb(res.statusCode+' '+body);
        }
        try {
            if(body.length){
                var data = JSON.parse(body);
                cb(null,data);
            } else {
                cb(null,body);
            }
        } catch (e) {
            cb(body+' '+ e);
        }
    });
}

function getCatagories(subdomain, ou, version,cb) {
    // Shortening our urls a little bit
    var tag = `/d2l/api/lp/${version || '1.20'}/${ou}`;

    // Getting every group catagory
    D2LGET(subdomain,`${tag}/groupcategories/`,function(err,data){
        if(err){
            course.error(new Error('Couldn\'t get the groupcatagories in d2l: '+err));
            return cb('Couldn\'t get the groupcatagories in d2l: '+err);
        }

        var canvasCategories;

        if(data.length){
            course.message(`Got ${data.length} groupcatagories`);
            // Mapping them to the canvas settings
            canvasCategories = data.map(function(cat){
                // See the 'notes' file for my notes on this
                var self_signup = undefined;
                if(cat.AutoEnroll){
                    if(cat.RestrictedByOrgUnitId){
                        self_signup = 'restricted';
                    } else {
                        self_signup = 'enabled';
                    }
                }
                return {
                    name: cat.Name,
                    group_limit: cat.MaxUsersPerGroup,
                    self_signup: self_signup,
                };
            });
        } else {
            course.message('There aren\'t any groupcatagories');
            canvasCategories = [];
        }
		
        cb(null,canvasCategories);
    });
}

function createCategories(courseId,cats, cb){
    async.map(cats,function(cat,catCB){
        canvas.post(`/api/v1/courses/${courseId}/group_categories`,cat,function(err,data){
            // errors are handled later
            catCB(null,{
                error:err,
                data:data,
                name:cat.name,
            });
        });
    },cb);
}

module.exports = (_course, stepCallback) => {
    /* Used to log successful actions */
    course = _course;
    // course.message('moduleName successfully ...');

    /* How to report an error (Replace "moduleName") */
	
    var subdomain = 'byui';
    var cookies = [
        'd2lSessionVal=jRmidd4JGBVdlodUY7KvjPQJs;',
        'd2lSecureSessionVal=IY2PJWVZcRaxVbR8zsEIfAffs;',
    ];
    addCookies(subdomain,cookies);
    
    course.info.D2LOU = course.info.D2LOU || 320004;

    getCatagories(subdomain,course.info.D2LOU,'1.20',function(err,data){
        if(err) return console.error(err);
		
        createCategories(course.info.canvasOU,data,function(err,data){
            data.forEach(res => {
                if(res.err){
                    course.warning(new Error(`couldn't create the ${res.name} group catagory`));
                } else {
                    course.log('Group Catagories Created',{
                        'Group Name': res.name
                    });
                }
            });
            stepCallback(null, course);
        });
    });
};
