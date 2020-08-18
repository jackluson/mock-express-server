/*
 * Desc: check request body if is valid
 * File: \routers\requestBodyValidater.ts
 * Project: mock
 * File Created: Tuesday, 18th August 2020 10:42:03 am
 */

export const validateRequestBody = (payLoad, schemaConfig, definitions) => {
  const { type, properties } = schemaConfig;
  let resquestBodyData: any;
  switch (type) {
    case 'object':
      resquestBodyData = validateBodyProperties(payLoad, properties, definitions);
      break;

    default:
      break;
  }
  return resquestBodyData;
};

export const validateBodyProperties = (payLoad, properties, definitions) => {
  console.log(': ------------------------------------------------');
  console.log('validateBodyProperties -> properties', properties);
  console.log(': ------------------------------------------------');
  const requestBodyValidateData = {};

  Object.keys(properties).forEach((property) => {
    const config = properties[property];
    const payLoadChild = payLoad[property];

    const { $ref, type } = config;
    let popertyInfo;
    switch (type) {
      case 'object1':
        popertyInfo = validateBodyProperties(payLoadChild, config.properties || {}, definitions);
        break;
      case 'array':
        // eslint-disable-next-line no-case-declarations
        let { items } = config;
        // eslint-disable-next-line no-case-declarations
        const refUrl = items?.$ref?.replace('#/definitions/', '');
        if (refUrl) {
          const schemaConfig = definitions[refUrl];
          popertyInfo = Array.from({ length: 5 }).map(() =>
            validateBodyProperties(payLoadChild, schemaConfig, definitions),
          );
        } else if (items.items) {
          popertyInfo = Array.from({ length: 3 });

          while (items.items) {
            popertyInfo.forEach(function (_item, index) {
              popertyInfo[index] = Array.from({ length: 2 });
            });
            items = items.items;
          }
          const refPath = items.$ref?.replace('#/definitions/', '');
          if (refPath) {
            // popertyInfo = mockArrayData(popertyInfo, definitions, refPath);
          }
        } else {
          if (!(payLoadChild instanceof Array)) {
            popertyInfo = `${property}参数应是一位数组--[${config.description || ''}]`;
          } else if (payLoadChild.length < 1) {
            popertyInfo = `${property}参数数组不应为空--[${config.description || ''}]`;
          } else {
            if (payLoadChild.some((item) => validateBasisTypeProperty(item, items, property))) {
              popertyInfo = `${property}参数数组中有成员不符合类型要求--[${config.description || ''}]`;
            }
          }
          // popertyInfo = validateBasisTypeProperty(payLoadChild, config, property);
        }
        break;
      default:
        // eslint-disable-next-line no-case-declarations
        const refPath = $ref?.replace('#/definitions/', '');
        if (refPath && 0) {
          const schemaConfig = definitions[refPath];
          popertyInfo = validateBodyProperties(payLoadChild, schemaConfig, definitions);
        } else {
          popertyInfo = validateBasisTypeProperty(payLoadChild, config, property);
        }
        break;
    }
    popertyInfo && (requestBodyValidateData[property] = popertyInfo);
  });
  return requestBodyValidateData;
};

const validateBasisTypeProperty = (value, config, property) => {
  if (value === undefined) {
    return `${property}参数缺失--[${config.description || ''}]`;
  }
  const valueType = typeof value;
  const { type, format } = config;
  const typeOrformat = format || type;
  let latch = false;
  switch (typeOrformat) {
    case 'string':
      if (valueType !== 'string') {
        latch = true;
      }
      break;
    case 'int32':
    case 'int64':
      if (valueType !== 'number') {
        latch = true;
      }
      break;
    case 'date-time':
      latch = isNaN(Date.parse(new Date(value).toString()));
      break;
    default:
      break;
  }
  if (latch) {
    return `${property}参数类型[${typeOrformat}]不符合--[${config.description || ''}]`;
  }
  console.log(': ---------------------------------------------------------');
  console.log('validateBasisTypeProperty -> value, config', value, config);
  console.log(': ---------------------------------------------------------');
};
