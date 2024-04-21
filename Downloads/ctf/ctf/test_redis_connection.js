const Redis = require('ioredis');

const redis = new Redis({
    host: 'redis-15529.c294.ap-northeast-1-2.ec2.redns.redis-cloud.com',
    port: 15529,
    username: 'default',
    password: 'Apple0508!'
});

// To delete all keys from the currently selected database
redis.flushdb();

// To delete all keys from all databases
redis.flushall();
