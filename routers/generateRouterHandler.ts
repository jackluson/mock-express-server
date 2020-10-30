/* eslint-disable no-case-declarations */
/*
 * Desc: 依据swagger配置文件，动态挂在handler
 * File: \routers\generatedHandler\index.ts
 * Project: mock
 * File Created: Wednesday, 5th August 2020 4:15:14 pm
 */

import { Response, Request, NextFunction } from 'express';
import { MockResponse } from 'typings/global';
import { mockResponseData } from './mockTypeData';
import { validateRequestBody } from './requestBodyValidater';
import formidable from 'formidable';
import config from '../mock.config';

const { codeMap } = config;

const form = formidable({ multiples: true });

export enum Code {
  Unlogin = codeMap.unlogin,
  ParameterError = codeMap.parameterError, //参数错误
  Success = codeMap.success,
  Unknown = 300001,
  Redirect,
}

const RequestBodyMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

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
      if (pathConfig[method]?.tags?.join().includes(filterTagsStr)) {
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
const generateRouterHandler = (swaggerConfig, filterTagsStr = '') => {
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
  /* 遍历赋值routers */
  for (const path in filterPaths) {
    const pathConfig = filterPaths[path];
    const methods = Object.keys(pathConfig || {});
    /* 不同请求方法，对应不同handler */
    for (const method of methods) {
      const handlerConfig = pathConfig[method];
      const { operationId, responses, parameters, consumes = [] } = handlerConfig;
      if (operationId) {
        /* 首先统一默认赋值handler */
        routers[operationId] = new Function('req', 'res', functionBody);
      }
      if (responses) {
        /* 覆盖之前默认的 */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        routers[operationId] = async (req: Request, res: Response, next: NextFunction) => {
          const { url, method, headers, query, params, body } = req;

          const payLoad = RequestBodyMethods.includes(method) ? body : query;
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
          const { authorization } = headers;

          // no has anthoriztion
          if (!authorization) {
            code = Code.Unlogin;
            response.data = {};
            response.data['message'] = 'authorized error, please login again';
            response.data['code'] = code;
          } else {
            let checkType = 'body';
            // 处理multipart/form-data类型
            if (headers['content-type']?.includes('multipart/form-data')) {
              await new Promise((resolve) => {
                // 不校验文件字段， 校验其他字段
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                form.parse(req, (err, fields, files) => {
                  if (err) {
                    resolve(err);
                    return;
                  }
                  checkType = 'query'; //其他字段放在query校验
                  Object.assign(query, fields);
                  resolve();
                });
              });
            }
            //   TODO:  parameters:
            // - $ref: '#/parameters/offsetParam'
            // - $ref: '#/parameters/limitParam'
            // abstract require params && body params
            const requiredParameters = parameters.filter(
              (parameters) => parameters.required || parameters.in === checkType,
            );

            // 参数错误
            if (requiredParameters.length > 0) {
              let responseKey;
              requiredParameters.forEach((requiredParameter) => {
                const { name } = requiredParameter;
                const payloadKey = requiredParameter.in;
                let responseKeyVal;
                switch (payloadKey) {
                  case 'header':
                    const ignoreName = name.toLowerCase();

                    const val = headers[ignoreName];
                    if (!val) {
                      responseKey = 'headerInfo';
                      responseKeyVal = `please catch ${name} params in header`;
                    }
                    break;
                  case 'query':
                    const qureyVal = query[name];
                    // only check if has the field
                    if (!qureyVal) {
                      responseKey = 'queryInfo';
                      responseKeyVal = `the ${name} param missed`;
                    }
                    break;
                  case 'path':
                    const paramVal = params[name];
                    if (!paramVal) {
                      responseKey = 'paramInfo';
                      responseKeyVal = `the ${name} param missed`;
                    }
                    break;
                  case 'body':
                    if (!RequestBodyMethods.includes(method)) {
                      break;
                    }
                    const { schema = {} } = requiredParameter;
                    const {
                      schema: { $ref },
                      required,
                    } = requiredParameter;

                    // only post method, validate requrst body
                    if (required && Object.keys(payLoad || {}).length === 0) {
                      // adjust conten-type is in consumes
                      const contentType = headers['content-type']?.replace(/([^;]*)(;.*)/, '$1');
                      if (!consumes.includes(contentType)) {
                        responseKey = 'headerInfo';
                        response[responseKey] = response[responseKey] || {};
                        response[responseKey].contentType = `Content-Type should is ${consumes}`;
                      }
                      response['message'] = 'body is missed';
                      code = Code.ParameterError;
                    } else {
                      const refUrl = $ref?.replace('#/definitions/', '');
                      const schemaConfig = refUrl ? definitions[refUrl] : schema;
                      const data = validateRequestBody(payLoad, schemaConfig, definitions);
                      if (data) {
                        response.schemaConfig = schemaConfig;
                        responseKey = 'bodyInfo';
                        response[responseKey] = data;
                      }
                    }

                    break;
                  default:
                    break;
                }
                if (responseKey && responseKeyVal) {
                  if (!response[responseKey]) {
                    response[responseKey] = {};
                  }
                  response[responseKey][name] = responseKeyVal;
                }
              });
              if (responseKey) {
                code = Code.ParameterError;
                response['message'] = 'parameters error';
              }
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
              res.redirect(301, 'https://dev-crm.vipthink.cn/#/account/login');
              break;
            case Code.Success:
              response.code = code;
              const statusCode = '200';
              const schema = responses[statusCode]?.schema || {};
              const { $ref } = schema;

              const schemaConfig = $ref ? definitions[$ref.replace('#/definitions/', '')] : schema;
              response.data = mockResponseData(schemaConfig, definitions);
              res.json(response);
              break;
            default:
              console.log('in--> default');
            // return res.json(response);
          }
        };
      }
    }
  }
  return routers;
};

export default generateRouterHandler;
