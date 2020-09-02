import { Code } from '../routers/generatedHandler';
import { OpenAPI2SchemaObject } from '@manifoldco/swagger-to-ts/dist-types/types';

type Data = {
  code?: number;
  message?: string;
  data?: Record<string, any>;
};

declare interface MockResponse {
  code: Code;
  schemaConfig?: OpenAPI2SchemaObject;
  data?: Data;
  [key: string]: any;
}
