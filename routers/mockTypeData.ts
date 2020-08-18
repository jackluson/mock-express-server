/*
 * Desc: 根据swagger 配置 模拟数据
 * File: \routers\mockTypeData.ts
 * Project: mock
 * File Created: Friday, 7th August 2020 8:02:43 pm
 */

import faker from 'faker/locale/zh_CN';

export const mockObjectData = (properties, definitions) => {
  const mockData = {};
  for (const property in properties) {
    const config = properties[property];
    const { $ref, type } = config;
    let data;
    switch (type) {
      case 'object':
        data = mockObjectData(config.properties || {}, definitions);
        break;
      case 'array':
        // eslint-disable-next-line no-case-declarations
        let { items } = config;
        // eslint-disable-next-line no-case-declarations
        const refUrl = items?.$ref?.replace('#/definitions/', '');
        if (refUrl) {
          const schemaConfig = definitions[refUrl];
          data = Array.from({ length: 5 }).map(() => mockResponseData(schemaConfig, definitions));
        } else if (items.items) {
          data = Array.from({ length: 3 });

          while (items.items) {
            data.forEach(function (_item, index) {
              data[index] = Array.from({ length: 2 });
            });
            items = items.items;
          }
          const refPath = items.$ref?.replace('#/definitions/', '');
          if (refPath) {
            const schemaConfig = definitions[refPath];
            console.log(': --------------------------------------------');
            console.log('mockObjectData -> schemaConfig', schemaConfig);
            console.log(': --------------------------------------------');
            data = mockArrayData(data, definitions, refPath);
          }
        } else {
          data = [];
        }
        break;
      default:
        // eslint-disable-next-line no-case-declarations
        const refPath = $ref?.replace('#/definitions/', '');
        if (refPath) {
          const schemaConfig = definitions[refPath];
          data = mockResponseData(schemaConfig, definitions);
        } else {
          data = basisTypeData(config);
        }
        break;
    }
    mockData[property] = data;
  }
  return mockData;
};

export const basisTypeData = (config) => {
  const { type, format } = config;
  let data;
  const typeOrformat = format || type;
  switch (typeOrformat) {
    case 'string':
      data = faker.random.words();
      break;
    case 'int32':
    case 'int64':
      data = faker.random.number();
      break;
    case 'date-time':
      data = String(faker.date.past());
      break;
    default:
      break;
  }
  return data;
};

export const mockArrayData = (arr: [], definitions, refPath) => {
  if (Array.isArray(arr)) {
    const mockDataList = [];
    arr.reduce((acc, cur, index) => {
      if (Array.isArray(cur)) {
        acc[index] = mockArrayData(cur, definitions, refPath);
      } else {
        const schemaConfig = definitions[refPath];
        acc[index] = mockResponseData(schemaConfig, definitions);
      }
      return acc;
    }, mockDataList);
    return mockDataList;
  }
};

export const mockResponseData = (schemaConfig, definitions) => {
  const { type, properties } = schemaConfig;
  let mockData: any;
  switch (type) {
    case 'object':
      mockData = mockObjectData(properties, definitions);
      break;

    default:
      break;
  }
  return mockData;
};
