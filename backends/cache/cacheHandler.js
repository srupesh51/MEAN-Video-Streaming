const redis = require("redis");
const util = require("util");
const client = redis.createClient(process.env.REDIS_PORT);

exports.getClient = () => {
    return client;
}

checkKey = async(key) => {
    const client = getClient();
    return new Promise((resolve, reject) => {
        client.exists(key, (err, val) => {
            console.log(err);
            return err ? reject(err) : resolve(val);
        }); 
    });
};

exports.getEntry = async(client, key) => {
    const getEntry = util.promisify(client.get).bind(client);
    let data = undefined; 
    await getEntry(key).then((values) => {
        data = values;
    }).catch((err) => {
        console.log(err);
    });
    console.log(data);
    return data;
}; 

exports.removeEntry = async(client, key) => {
    const keyBool =  await checkKey(key);
    console.log(keyBool);
    if(keyBool) {
        return new Promise((resolve, reject) => {
            client.delete(key, (err, val) => {
                return err ? reject(err) : resolve(val);
            });
        });
    } else {
        return undefined;
    }
};

exports.addEntry = async(client, key, value) => {
    const setAsync =  util.promisify(client.setex).bind(client);
    console.log(value, JSON.stringify(value));
    await setAsync(key, 3600, JSON.stringify(value)).then((val) => {
        console.log(val);
    }).catch((err) => {
        console.log(err);
    });
};


