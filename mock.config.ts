const config = {
  port: 9009, // 启动端口
  localPath: '', // 相对于项目本地swagger配置文件夹的绝对路径(会遍历该文件夹下的所有文件swagger配置文件, 例如/local)
  selectedTag: '入职管理', // 对应swagger config 的tags，空的话,则选择全部tags的path， 配置的话经过筛选后,只启动该tag下面的接口
  swaggerUrl: 'https://petstore.swagger.io/v2/swagger.json', // swagger config 接口路径,例如：https://petstore.swagger.io/v2/swagger.json
  isLocalOpenRedis: false, // 是否开始redis存储swagger 配置（一般用于开发阶段）
  isOpenValidParams: false, // 是否检验参数类型合法，false，则不检验, 直接返回响应数据
  codeMap: {
    success: 20000, // 成功逻辑code
    unlogin: 40001, // 没有登录
    parameterError: 40003, //参数错误
  },
};

export default config;
