import { Code } from '../routers/generatedHandler';
import { OpenAPI2SchemaObject } from '@manifoldco/swagger-to-ts/dist-types/types';

declare interface MockResponse {
  code: Code;
  schemaConfig?: OpenAPI2SchemaObject;
  [key: string]: any;
}
