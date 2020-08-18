/*
 * Desc: check request body if is valid
 * File: \routers\requestBodyValidater.ts
 * Project: mock
 * File Created: Tuesday, 18th August 2020 10:42:03 am
 */

export const validateRequestBody = (schemaConfig) => {
  console.log(': ------------------------------');
  console.log('generatedHandler -> schemaConfig', schemaConfig);
  console.log(': ------------------------------');
  const { type } = schemaConfig;
  let resquestBodyData: any;
  switch (type) {
    case 'object':
      // resquestBodyData = mockObjectData(schemelConfig.properties, definitions);
      break;

    default:
      break;
  }
  return resquestBodyData;
};
