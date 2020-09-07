/*
 * Desc: 根据swagger 配置 模拟数据
 * File: \routers\mockTypeData.ts
 * Project: mock
 * File Created: Friday, 7th August 2020 8:02:43 pm
 */

import faker from 'faker/locale/zh_CN';

export const mockResponseData = (schemaConfig, definitions) => {
  const { type, items, properties } = schemaConfig;
  let mockData: any;
  switch (type) {
    case 'object':
      mockData = properties ? mockObjectData(properties, definitions) : {};
      break;
    case 'array':
      mockData = handleArrayTypeCondition(items, definitions);
      break;
    default:
      mockData = basisTypeData(schemaConfig);
      break;
  }
  return mockData;
};

export const mockObjectData = (properties, definitions) => {
  const mockData = {};
  Object.keys(properties).forEach((property) => {
    const config = properties[property];
    const { $ref, type } = config;
    let data;
    switch (type) {
      case 'object':
        data = mockObjectData(config.properties || {}, definitions);
        break;
      case 'array':
        // eslint-disable-next-line no-case-declarations
        data = handleArrayTypeCondition(config, definitions);
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
  });

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
    case 'integer':
    case 'int32':
    case 'int64':
      data = faker.random.number();
      break;
    case 'double':
    case 'float':
      data = Math.random();
      break;
    case 'boolean':
      data = faker.random.boolean();
      break;
    case 'date-time':
      data = String(faker.date.past());
      break;
    case 'null':
      data = null;
      break;
    default:
      break;
  }
  return data;
};

export const handleArrayTypeCondition = (config, definitions) => {
  let { items } = config;
  let data: any[] = Array.from({ length: 3 });
  if (items.items) {
    while (items.items) {
      data.forEach(function (_item, index) {
        data[index] = Array.from({ length: 2 });
      });
      items = items.items;
    }
  }
  data = mockArrayData(data, definitions, items);
  return data;
};

export const mockArrayData = (arr: any[], definitions, config) => {
  const { $ref } = config;
  const refPath = $ref?.replace('#/definitions/', '');

  if (Array.isArray(arr)) {
    const mockDataList = [];
    /* traverse to fill array member data */
    arr.reduce((acc, cur, index) => {
      if (Array.isArray(cur)) {
        acc[index] = mockArrayData(cur, definitions, config);
      } else {
        const curConfig = refPath ? definitions[refPath] : config;
        acc[index] = mockResponseData(curConfig, definitions);
      }
      return acc;
    }, mockDataList);
    return mockDataList;
  }
};
