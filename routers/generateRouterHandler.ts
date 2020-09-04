/* eslint-disable no-case-declarations */
/*
 * Desc: 依据swagger配置文件，动态挂在handler
 * File: \routers\generatedHandler\index.ts
 * Project: mock
 * File Created: Wednesday, 5th August 2020 4:15:14 pm
 */

import { Response, Request } from 'express';
import { MockResponse } from 'typings/global';
import { mockResponseData } from './mockTypeData';
import { validateRequestBody } from './requestBodyValidater';

export enum Code {
  Unlogin = 10001,
  Redirect,
  ParameterError = 30001, //参数错误
  Unknown,
  Success = 30000,
}

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
const generateRouterHandler = (swaggerConfig, filterTagsStr = ' （薪酬）人事权限相关接口') => {
  const routers = {};
  const { paths, definitions } = swaggerConfig;

  const code = Code.Success;

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
        /* 覆盖之前默认的 */
        routers[operationId] = (req: Request, res: Response) => {
          const { url, method, headers, query, body } = req;
          const payLoad = method === 'GET' ? query : body;

          let code: Code = Code.Success;
          const response: MockResponse = {
            code,
            req: {
              url,
              method,
              [method === 'GET' ? 'query' : 'body']: payLoad,
            },
            data: undefined,
            header: undefined,
          };

          // 没有权限
          const { authorization } = headers;
          let requiredParameters = [];
          if (!authorization) {
            code = Code.Unlogin;
            response.data = {};
            response.data['message'] = 'authorized error, please login again';
            response.data['code'] = code;
          } else {
            /* 提取必须参数 */
            requiredParameters = parameters.filter((parameters) => parameters.required);
          }

          // 参数错误
          if (requiredParameters.length > 0) {
            requiredParameters.forEach((requiredParameter) => {
              const { name } = requiredParameter;
              const payloadKey = requiredParameter.in;
              switch (payloadKey) {
                case 'header':
                  const val = headers[name];
                  if (!val) {
                    if (!response.header) {
                      response.header = {};
                    }
                    response.header[name] = `请求头请携带${name}参数`;
                  }
                  break;
                case 'query':
                  const qureyVal = query[name];
                  if (!qureyVal) {
                    response.parametersErrorObj = {};
                    response.parametersErrorObj[name] = `${name}参数缺失`;
                  }
                  break;
                case 'body':
                  const {
                    schema: { $ref },
                    required,
                  } = requiredParameter;
                  if (required && Object.keys(payLoad || {}).length === 0) {
                    code = Code.ParameterError;
                    response['message'] = 'parameters missed';
                  } else {
                    const refUrl = $ref?.replace('#/definitions/', '');
                    const schemaConfig = definitions[refUrl];
                    response.schemaConfig = schemaConfig;
                    const data = validateRequestBody(payLoad, schemaConfig, definitions);
                    response.parametersErrorObj = data;
                  }

                  break;
                default:
                  break;
              }
            });

            if (Object.keys(response.parametersErrorObj || response.header || {}).length) {
              code = Code.ParameterError;
              response['message'] = 'parameters error';
            }
          }

          if (payLoad.redirect) {
            code = Code.Unknown;
          }

          switch (code) {
            /* 没有登录 */
            case Code.Unlogin:
              response.code = code;
              res.status(401).json(response);
              break;
            case Code.ParameterError:
              response.code = code;
              res.json(response);
              break;
            case Code.Unknown:
              response.code = code;
              res.redirect(301, 'https://google.com');
              break;
            case Code.Success:
              response.code = code;
              const statusCode = '200';
              const $ref = responses[statusCode]?.schema?.$ref;
              const refUrl = $ref.replace('#/definitions/', '');
              const schemaConfig = definitions[refUrl];
              response.data = {
                ...mockResponseData(schemaConfig, definitions),
              };

              return res.json(response);
            default:
              return res.json(response);
          }
        };
      }
    }
  }
  return routers;
};

export default generateRouterHandler;
