const config = {
  port: 9009, // 启动端口
  localPath: '', // 本地swagger配置文件夹的绝对路径(会遍历该文件夹下的所有文件swagger配置文件)
  selectedTag: '', // 对应swagger config 的tags，空的话,则选择全部tags的path， 配置的话经过筛选后,只启动该tag下面的接口
  swaggerUrl: 'https://dev-oa.vipthink.cn/oa/v2/api-docs?group=COMPLEX', // swagger config 接口路径
  isLocalOpenRedis: false, // 是否开始redis存储swagger 配置（一般用于开发阶段）
  isOpenValidParams: false, // 是否检验参数类型合法，false，则不检验, 直接返回响应数据
  codeMap: {
    success: 20000, // 成功逻辑code
    unlogin: 40001, // 没有登录
    parameterError: 40003, //参数错误
  },
};

export default config;
