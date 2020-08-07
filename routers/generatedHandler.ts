/*
 * Desc: 依据swagger配置文件，动态挂在handler
 * File: \routers\generatedHandler\index.ts
 * Project: mock
 * File Created: Wednesday, 5th August 2020 4:15:14 pm
 */

import { mockResponseData } from './mockTypeData';
import { Response, Request } from 'express';

/**
 * 依据tag过滤Paths
 *
 * @param {Record<string, any>} paths swagger 配置的Paths
 * @param {string} [filterTagsStr]
 * @returns
 */
const filterPath = (paths: Record<string, any>, filterTagsStr: string) => {
  const targetPaths = {};
  for (const path in paths) {
    const pathConfig = paths[path];
    const methods = Object.keys(pathConfig || {});
    for (const method of methods) {
      if (pathConfig[method]?.tags?.includes(filterTagsStr)) {
        if (!targetPaths[path]) {
          targetPaths[path] = {};
        }
        targetPaths[path][method] = pathConfig[method];
      }
    }
  }
  return targetPaths;
};

/**
 *
 * @param {*} routers 对应router 处理方法对象
 * @param {*} swaggerConfig
 * @param {string} [filterTagsStr='']
 */
const generatedHandler = (routers, swaggerConfig, filterTagsStr = '（薪酬）薪酬计算接口') => {
  const { paths, definitions } = swaggerConfig;

  const code = 30000;

  const functionBody = `
  const response = {
    code: ${code},
    data: {
      message: '没有相应参数默认返回结果',
    },
  };
  return res.json(response);
`;
  const filterPaths = filterTagsStr ? filterPath(paths, filterTagsStr) : paths;
  console.log(': --------------------------------------------');
  console.log('generatedHandler -> filterPaths', filterPaths);
  console.log(': --------------------------------------------');

  /* 遍历赋值routers */
  for (const path in filterPaths) {
    const pathConfig = filterPaths[path];
    const methods = Object.keys(pathConfig || {});
    /* 不同请求方法，对应不同handler */
    for (const method of methods) {
      const handlerConfig = pathConfig[method];
      const { operationId, responses, parameters } = handlerConfig;
      if (operationId) {
        /* 首先统一默认赋值handler */
        routers[operationId] = new Function('req', 'res', functionBody);
      }
      if (responses) {
        const statusCode = Object.keys(responses);
        const code = '200';
        const $ref = responses[code]?.schema?.$ref;
        if (statusCode.includes(code) && $ref) {
          const refUrl = $ref.replace('#/definitions/', '');
          const schemeConfig = definitions[refUrl];
          if (schemeConfig) {
            /* 覆盖之前默认的 */
            routers[operationId] = (req: Request, res: Response) => {
              console.log('parameters', parameters);
              console.log('headers', req.headers);

              let code = 30000;
              const response = {
                code,
                schemeConfig,
                req: {
                  url: req.url,
                  method: req.method,
                  [req.method === 'GET' ? 'query' : 'body']: req.method === 'GET' ? req.query : req.body,
                },
                data: {},
              };
              const { authorization } = req.headers;

              if (!authorization) {
                code = 10001;
              }

              switch (code) {
                /* 没有登录 */
                case 10001:
                  response.code = code;
                  return res.status(401).json(response);
                case 10002:
                  response.code = code;
                  res.redirect(301, 'https://google.com');
                  break;
                default:
                  response.data = {
                    ...mockResponseData(schemeConfig, definitions),
                  };
                  return res.json(response);
              }
            };
          }
        }
      }
    }
  }
};

export default generatedHandler;
