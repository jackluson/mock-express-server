import redis from 'redis';
import { promisify } from 'util';
import axios from 'axios';
const client = redis.createClient(6379, '127.0.0.1');
let flag = true;
client.on('error', function(err) {
  flag = false;
  console.log('err', err);
});
const getAsync = promisify(client.hget).bind(client);
const hmName = 'mockSite';
const swaggerUrl = `https://dev-oa.vipthink.cn/oa/v2/api-docs?group=COMPLEX`;
const getSwaggerConfig = async () => {
  if (flag) {
    const swaggerConfig = await getAsync(hmName, swaggerUrl);
    const jsonData = typeof swaggerConfig === 'string' && JSON.parse(swaggerConfig);
    if (typeof jsonData === 'object') {
      return jsonData;
    }
  }

  try {
    const res: Record<string, any> = await axios.get(swaggerUrl);
    if (flag) {
      client.hmset(hmName, { [swaggerUrl]: JSON.stringify(res.data) }, redis.print);
      client.expire(hmName, 60 * 60 * 24, redis.print);
    }
    return res.data;
  } catch (error) {
    console.log('getSwaggerConfig -> error', error);
  }
};

export default getSwaggerConfig;
