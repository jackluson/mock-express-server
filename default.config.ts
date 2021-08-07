const config = {
  port: 9009, // 启动端口
  copy: false, // 是否开始自动复制
  localPath: '', // 1. 本机绝对路径；2. 相对项目根目录路径（拼接`process.cwd()`）路径；（若是文件夹路径，则会遍历该文件夹下的所有文件 swagger 配置文件), 例如：'local/api-docs.json'
  tag: '', // 对应swagger config 的tags，空的话,则选择全部tags的path， 配置的话经过筛选后,只启动该tag下面的接口, 例如：/pet'
  url: 'https://petstore.swagger.io/v2/swagger.json', // swagger config 接口路径,例如：https://petstore.swagger.io/v2/swagger.json, 如果同时配置了url与localPath，合并两者，若有冲突，以url配置为止
  openLocalRedis: false, // 是否开始redis存储swagger 配置（一般用于开发阶段）
  openValidParams: false, // 是否检验请求参数类型合法，false，则不检验, 直接返回响应数据
  // 请求配置
  // 响应配置
  codeMap: {
    success: 20000, // 成功逻辑code
    unlogin: 40001, // 没有登录
    parameterError: 40003, //参数错误
  },
};

export default config;
