import chalk from 'chalk';
import axios from 'axios';
import { promisify } from './index';
import config from '../default.config';

const { openLocalRedis } = config;
const getSwaggerConfig = async (swaggerUrl: string) => {
  if (!swaggerUrl) return;
  if (openLocalRedis) {
    return new Promise((resolve, reject) => {
      import('redis').then(async (_) => {
        const redis = _.default;
        const client = redis.createClient(6379, '127.0.0.1');
        let noError = true;
        client.on('error', function (err) {
          noError = false;
          console.log(chalk.red('errorInfo:', err));
        });
        const hmName = 'mockSite';
        const getAsync = promisify(client.hget.bind(client));
        if (noError) {
          const swaggerConfig = await getAsync(hmName, swaggerUrl + 'j');
          const jsonData = typeof swaggerConfig === 'string' && JSON.parse(swaggerConfig);
          // if has data , return data;
          if (typeof jsonData === 'object') {
            return resolve(jsonData);
          }
        }
        return axios
          .get(swaggerUrl)
          .then((res) => {
            const data = res.data;
            if (noError) {
              client.hmset(hmName, { [swaggerUrl]: JSON.stringify(res.data) }, redis.print);
              client.expire(hmName, 60 * 60 * 24, redis.print);
            }
            resolve(data);
          })
          .catch((error) => {
            console.log(chalk.red(`${swaggerUrl} request error-->`, error));
            reject(error);
          });
      });
    });
  } else {
    return axios
      .get(swaggerUrl)
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.log(chalk.red(`${swaggerUrl} request error-->`, error));
      });
  }
};

export default getSwaggerConfig;
