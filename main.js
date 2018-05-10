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
        if (err) return cb(err);
        if (res.statusCode != 200){
            return cb(res.statusCode+' '+body);
        }
        try {
            var data = JSON.parse(body);
            cb(null,data);
        } catch (e) {
            cb(body+' '+ e);
        }
    });
}

function getCatagories(subdomain, ou, version,callback) {
    // Shortening our urls a little bit
    var tag = `/d2l/api/lp/${version || '1.20'}/${ou}`;

    // Getting every group catagory
    D2LGET(subdomain,`${tag}/groupcategories/`,function(err,catagories){
        if(err){
            return callback('Couldn\'t get the groupcatagories in d2l: '+err);
        }
        
        // If there aren't any group catagories
        if(!catagories.length){
            course.message('There aren\'t any groupcatagories');
            callback(null,[]);
            return;
        } else {
            course.message(`Got ${catagories.length} groupcatagories`);
        }
        
        async.forEach(catagories,function getGroups(catagory,cb){
            D2LGET(subdomain,`${tag}/groupcategories/${catagory.GroupCategoryId}/groups/`,(err,groups) => {
                if(err){
                    return cb(`Couldn't get the groups from the ${catagory.Name} catagory in d2l: ${err}`);
                }
                catagory.Groups = groups;
                cb();
            });
        }, function final(err){
            if(err){
                callback(err);
            }
            
            // Mapping them to the canvas settings
            catagories = convertToCanvasSettings(catagories);
            callback(null,catagories);
        });
    });
}

function convertToCanvasSettings(catagories) {
    return catagories.map(function (catagory) {
        // See the 'notes' file for my notes on this
        var self_signup = undefined;
        if (catagory.AutoEnroll) {
            if (catagory.RestrictedByOrgUnitId) {
                self_signup = 'restricted';
            }
            else {
                self_signup = 'enabled';
            }
        }
        return {
            name: catagory.Name,
            group_limit: catagory.MaxUsersPerGroup,
            self_signup: self_signup,
            groups: catagory.Groups.map(function(group){
                return {
                    name:group.Name,
                    description:group.Description.Text
                };
            })
        };
    });
}

function createCategories(courseId,catagories, cb){
    async.map(catagories,function(catagory,catCB){
        // takes the groups out of the catagory
        var groups = catagory.groups;
        delete catagory.groups;

        canvas.post(`/api/v1/courses/${courseId}/group_categories`,catagory,function(err,createdCatagory){
            if(err){
                catCB(null,{err:`Error creating the ${catagory.Name} catagory in canvas: ${err}`});
                return;
            }

            async.map(groups,function(group,groupcb){
                canvas.post(`/api/v1/group_categories/${createdCatagory.id}/groups`,group,groupcb);
            },function(err,createdGroups){
                if(err){
                    catCB(null,{err:`Error creating the groups for ${catagory.Name} in canvas: ${err}`});
                    return;
                }
                // errors are handled later
                catCB(null,{
                    catagory:createdCatagory,
                    groups:createdGroups,
                    name:catagory.name,
                });
            });

        });
    },cb);
}

module.exports = (_course, stepCallback) => {
    // Create the global variable
    course = _course;

    if(!course.settings.cookies){
        course.error(new Error('Didn\'t recieve the cookies, so I couldn\'t access the groups in d2l'));
        return;
    }

    addCookies(course.info.domain,course.settings.cookies.map(c => c.name+'='+c.value));

    course.info.D2LOU = course.info.D2LOU || 340002;

    // Get the catagories from d2l
    getCatagories(course.info.domain,course.info.D2LOU,'1.20',function(err,data){
        if(err) {
            course.warning(new Error(err));
            stepCallback(null, course);
            return; 
        }
        // create the catagories in canvas
        createCategories(course.info.canvasOU,data,function(err,data){
            
            // Log it all
            data.forEach(function(res){
                if(res.err){
                    course.warning(new Error(res.err));
                } else {
                    course.log('Group Catagories Created',{
                        'Catagory Name': res.catagory.name,
                        'Catagory Id': res.catagory.id
                    });
                    res.groups.forEach(group => {
                        course.log('Group Created',{
                            'Catagory Name': res.catagory.name,
                            'Catagory Id': res.catagory.id,
                            'Group Name': group.name,
                            'Group Id': group.id,
                        });
                    });
                }
            });

            // Finish!
            stepCallback(null, course);
        });
    });
};
