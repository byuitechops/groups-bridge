function D2LGET(url) {
    url = new URL(url, 'https://byui.brightspace.com/').href;
    return new Promise((resolve,reject) => {
        request.get(url, function (err, res, body) {
            if (err) return reject(err);
            try {
                // For some reason the json parse dosen't work
                var data = JSON.parse(body);
                resolve(data);
            } catch (e) {
                try {
                    // So when that fails i'm cheating and using eval
                    data = eval(body);
                    resolve(data);

                } catch(e){
                    reject(e);
                }
            }
        });
    });
}