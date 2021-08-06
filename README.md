# 前端 Mock 数据服务平台

> 基于 express、swagger 的 Mock 数据服务平台, 为对接接口的过程提供便利

## 介绍 :jack_o_lantern:

根据 swagger 数据源， 利用 expreesd 动态创建生成 router(包括 route path、route method)，使 mock 接口具有校验参数， 返回 mock 数据的特性

目前只支持[swagger 2.0](https://swagger.io/docs/specification/2-0/what-is-swagger/) 规范配置 JSON 数据格式

**大概原理：**

利用 swagger 的 path 生成对应的接口对应、path 下的 parameters 用来校验接口请求的参数、path 下面的 responses 用来 mock 接口返回接口参数，如果传参有误的话，则会返回具体错误详情。

## 快速开始

在 `mock.config.ts` 中配置好 swaggerUrl 或者 localPath 即可

```shell
// npm
npm i -g typescript
npm install

// yarn
yarn global add typescript
yarn install
```

然后在你的项目目录下执行`npm run start`即可

## `mock.config.ts` 配置项

#### port

值类型：number

描述：mock server 端口号

### localPath

值类型：string

描述：本地 swagger 配置文件夹的绝对路径(会遍历该文件夹下的所有文件 swagger 配置文件)

### selectedTag

值类型：string

描述：对应 swagger config 的 tags，空的话,则选择全部 tags 的 path， 配置的话经过筛选后,只启动该 tag 下面的接口

### url

值类型：string

描述：数据源的获取路径，目前只支持 Swagger 2.0。如 "https://petstore.swagger.io/v2/swagger.json"

### isLocalOpenRedis

值类型：boolean

描述: 是否开始 redis 存储 swagger 配置（一般用于调试阶段）

### isOpenValidParams

值类型：boolean

描述: 是否开始 redis 存储 swagger 配置（一般用于调试阶段）

### codeMap

值类型：object

描述:成功,错误等状态码 Code 映射 Map

子字段：

- 字段名："success" 类型：number 含义：请求正确 code
- 字段名："unlogin" 类型：number 含义：没有登录 code(token 过期)
- 字段名："parameterError" 类型：类型：number 含义：传参错误

如:

```js
codeMap: {
  success: 20000, // 成功逻辑code
  unlogin: 40001, // 没有登录
  parameterError: 40003, //参数错误
},
```
