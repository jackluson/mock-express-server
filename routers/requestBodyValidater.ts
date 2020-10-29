/*
 * Desc: check request body if is valid
 * File: \routers\requestBodyValidater.ts
 * Project: mock
 * File Created: Tuesday, 18th August 2020 10:42:03 am
 */

import { Primitive } from 'type-fest';

export const validateRequestBody = (payLoad, schemaConfig, definitions) => {
  const { type, properties, required = [] } = schemaConfig;
  const payLoadType = typeof payLoad;
  let resquestBodyData: any;
  if (payLoadType === 'object' && type !== payLoadType) {
    return 'the data type not meet';
  }
  switch (type) {
    case 'object':
      resquestBodyData = validateBodyProperties(payLoad, properties, definitions, required);
      break;
    case 'array':
      resquestBodyData = handleArrayTypeCondition(payLoad, schemaConfig, definitions);
      break;
    default:
      resquestBodyData = validateBasisTypeProperty(payLoad, schemaConfig);
      break;
  }
  return resquestBodyData;
};

/**
 * validate object data
 * @param {*} payLoad
 * @param {*} properties
 * @param {*} definitions
 * @param {*} [requiredArray=[]]
 * @returns
 */
export const validateBodyProperties = (payLoad, properties, definitions, requiredArray = []) => {
  let requestBodyValidateData = undefined;

  Object.keys(properties).forEach((property) => {
    const config = properties[property];
    const payLoadChild = payLoad[property];
    const isRequired = requiredArray.includes(property);

    const { $ref, type, required, properties: childProperties = {} } = config;
    let propertyInfo;
    /* exclude 0 false */
    if (!['', null, undefined].includes(payLoadChild)) {
      switch (type) {
        case 'object':
          propertyInfo = validateBodyProperties(payLoadChild, childProperties, definitions, required);
          break;
        case 'array':
          propertyInfo = handleArrayTypeCondition(payLoad[property], config, definitions, property, isRequired);
          break;
        default:
          // eslint-disable-next-line no-case-declarations
          const refPath = $ref?.replace('#/definitions/', '');
          if (refPath) {
            const schemaConfig = definitions[refPath];
            propertyInfo = validateBodyProperties(payLoadChild, schemaConfig, definitions);
          } else {
            propertyInfo = validateBasisTypeProperty(payLoadChild, config, isRequired);
          }
          break;
      }
    } else if (required === true || isRequired) {
      propertyInfo = `the param [${config.description || ''}] is required, but not is missed`;
    }

    if (propertyInfo) {
      if (!requestBodyValidateData) {
        requestBodyValidateData = {};
      }
      requestBodyValidateData[property] = propertyInfo;
    }
  });
  return requestBodyValidateData;
};

/**
 * validate array data
 * @param {*} payLoad
 * @param {*} property
 * @param {*} config
 * @param {*} definitions
 * @param {*} isRequired
 * @returns
 */
export const handleArrayTypeCondition = (
  payLoadArr: any[],
  config: Record<string, any>,
  definitions,
  property?: string,
  isRequired?,
) => {
  let propertyInfo;
  const { required = isRequired } = config;

  let { items } = config;
  // not empty
  if (payLoadArr) {
    // if not array type data
    if (!(payLoadArr instanceof Array)) {
      propertyInfo = `the params need array type data--[${config.description || ''}]`;
      return propertyInfo;
    } else if (payLoadArr.length === 0 && required) {
      propertyInfo = `the params is empty --[${config.description || ''}]`;
      return propertyInfo;
    }

    if (items.items) {
      let payLoadData = payLoadArr;
      while (items.items) {
        /* if required */
        if (items.required && payLoadData.length < 1) {
          propertyInfo = 'the param is missed';
          return propertyInfo;
        }
        /* traverse every item */
        propertyInfo = payLoadData.map((payLoadChildItem, index) => {
          return Array.isArray(payLoadChildItem) ? '' : `the member[${index}] data type error`;
        });
        if (propertyInfo.join('')) return propertyInfo;
        /* flatten 第一层 */

        payLoadData = payLoadData.reduce((acc, cur) => {
          acc = acc.concat(cur);
          return acc;
        }, []);

        items = items.items;
      }

      const refPath = items.$ref?.replace('#/definitions/', '');
      if (refPath) {
        const schemaConfig = definitions[refPath];

        const payLoadChildrenData = payLoadData.map((item) => validateRequestBody(item, schemaConfig, definitions));
        propertyInfo = payLoadChildrenData.some((payLoadChildData) => !!payLoadChildData)
          ? payLoadChildrenData
          : undefined;
      } else {
        if (payLoadData.some((item) => validateBasisTypeProperty(item, items))) {
          propertyInfo = `${property} params data have member isn't fill data type --[${config.description || ''}]`;
        }
      }
    } else {
      const refUrl = items.$ref?.replace('#/definitions/', '');
      const schemaConfig = refUrl ? definitions[refUrl] : items;
      const payLoadChildValidRes = [];
      for (const payLoadChildItem of payLoadArr) {
        payLoadChildValidRes.push(validateRequestBody(payLoadChildItem, schemaConfig, definitions));
      }
      if (payLoadChildValidRes.join('')) {
        propertyInfo = payLoadChildValidRes;
      }
    }
    /* required but is missing  */
  } else if (required) {
    propertyInfo = 'it require array data but missing';
  }

  return propertyInfo;
};

/**
 * validate basic type data
 *
 * @param {*} value basic type value
 * @param {*} config value config
 * @param {*} [isRequired]
 * @returns validate value result or undefined
 */
const validateBasisTypeProperty = (
  value: Exclude<Primitive, symbol | bigint>,
  config: Record<string, Exclude<Primitive, symbol>>,
  isRequired?: boolean,
) => {
  const { type, format, description, required = isRequired } = config;

  if (value === undefined) {
    return required ? `the param [${description || ''}] is required, but not is missed` : undefined;
  }
  const valueType = typeof value;
  const typeOrformat = format || type;
  let latch = false;
  switch (typeOrformat) {
    case 'string':
      if (valueType !== 'string') {
        latch = true;
      }
      break;
    case 'integer':
    case 'int32':
    case 'int64':
    case 'double':
    case 'float':
      if (valueType !== 'number') {
        latch = true;
      }
      break;
    case 'boolean':
      if (valueType !== 'boolean') {
        latch = true;
      }
      break;
    case 'date-time':
      latch = valueType !== 'boolean' && isNaN(Date.parse(new Date(value as any).toString()));
      break;
    default:
      break;
  }
  if (latch) {
    return `the param [${description || ''}] doesn't meet type data , it need ${typeOrformat} type`;
  }
};
