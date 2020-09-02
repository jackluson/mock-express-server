/*
 * Desc: check request body if is valid
 * File: \routers\requestBodyValidater.ts
 * Project: mock
 * File Created: Tuesday, 18th August 2020 10:42:03 am
 */

export const validateRequestBody = (payLoad, schemaConfig, definitions) => {
  const { type, properties } = schemaConfig;
  const payLoadType = typeof payLoad;
  let resquestBodyData: any;
  if (type !== payLoadType) {
    return 'data type not meet';
  }
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
  let requestBodyValidateData;

  Object.keys(properties).forEach((property) => {
    const config = properties[property];
    const payLoadChild = payLoad[property];

    const { $ref, type, required } = config;
    let propertyInfo;
    /* exclude 0 false */
    if (!['', null, undefined].includes(payLoadChild)) {
      switch (type) {
        case 'object':
          propertyInfo = validateBodyProperties(payLoadChild, config.properties || {}, definitions);
          break;
        case 'array':
          propertyInfo = this.validaArrayTypeProperty(payLoad, config, property, definitions);
          break;
        default:
          // eslint-disable-next-line no-case-declarations
          const refPath = $ref?.replace('#/definitions/', '');
          if (refPath) {
            const schemaConfig = definitions[refPath];
            propertyInfo = validateBodyProperties(payLoadChild, schemaConfig, definitions);
          } else {
            propertyInfo = validateBasisTypeProperty(payLoadChild, config, property);
          }
          break;
      }
    } else if (required) {
      propertyInfo = 'the params is missed';
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

export const validaArrayTypeProperty = (payLoad, config, property, definitions) => {
  let propertyInfo;
  const payLoadChild = payLoad[property];
  const { required } = config;
  let { items } = config;

  // not empty
  if (payLoadChild) {
    // if not array type data
    if (!(payLoadChild instanceof Array)) {
      propertyInfo = `the params need array type data--[${config.description || ''}]`;
      return propertyInfo;
    } else if (payLoadChild.length < 1 && required) {
      propertyInfo = `the params is empty --[${config.description || ''}]`;
      return propertyInfo;
    }

    const refUrl = items.$ref?.replace('#/definitions/', '');
    // const refUrl = 'BatchDepartLeaderQueryDto';
    if (refUrl) {
      const schemaConfig = definitions[refUrl];
      const payLoadChildrenData = payLoadChild.map((item) => validateRequestBody(item, schemaConfig, definitions));
      propertyInfo = payLoadChildrenData.some((payLoadChildData) => !!payLoadChildData)
        ? payLoadChildrenData
        : undefined;
    } else if (items.items) {
      let payLoadData = payLoadChild;
      while (items.items) {
        /* if required */
        if (items.required && payLoadData.length < 1) {
          propertyInfo = 'params is missed';
          return propertyInfo;
        }
        /* traverse every item */
        propertyInfo = payLoadData.map((payLoadChildItem) => {
          return Array.isArray(payLoadChildItem) ? '' : `${property} has member data type error`;
        });
        if (propertyInfo.toString()) return propertyInfo;
        /* flaten 第一层 */
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
        // basic type
        if (payLoadData.some((item) => validateBasisTypeProperty(item, items, property))) {
          propertyInfo = `${property} params data have member isn't fill data type --[${config.description || ''}]`;
        }
      }
    } else {
      if (payLoadChild.some((item) => validateBasisTypeProperty(item, items, property))) {
        propertyInfo = `${property} params data have member isn't fill data type --[${config.description || ''}]`;
      }
    }
    /* required but is missing  */
  } else if (!payLoadChild && required) {
    propertyInfo = 'it require array data but missing';
  }
  return propertyInfo?.toString() ? propertyInfo : undefined;
};

const validateBasisTypeProperty = (value, config, property) => {
  const { type, format, description, required } = config;

  if (value === undefined) {
    return required ? `${property}<${type}> is required--[${description || ''}]` : undefined;
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
    return `${property} params type doesn't meet require  [${typeOrformat}]--[${config.description || ''}]`;
  }
};
