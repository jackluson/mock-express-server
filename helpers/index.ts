import _ from 'lodash';

const customizeMergeSwaggerConfig = (objValue, srcValue, key, object, source, stack) => {
  // swagger config tags field;
  if (_.isArray(objValue) && key === 'tags' && (_.has(object, 'swagger') || stack.size === 1)) {
    for (const item of srcValue) {
      const index = _.findIndex(objValue, item);
      /* if index === -1 not found */
      if (!~index) {
        objValue.push(item);
      }
    }
    return objValue;
  }
  // Swagger 2.0 supports get, post, put, patch, delete, head, and options.
  if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(key)) {
    // if no has operationId
    if (!srcValue?.operationId) {
      srcValue.operationId = _.uniqueId(key);
    }
    return srcValue;
  }
};

export { customizeMergeSwaggerConfig };
