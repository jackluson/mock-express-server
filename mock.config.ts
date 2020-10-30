const config = {
  port: 9009, // 启动端口
  localPath: '', // 本地swagger 配置文件绝对路径(遍历该文件下下面所有文件)
  selectedTag: '', // 对应swagger config 的tab，默认全部， 配置的话， 只启动该tag下面的接口
  swaggerUrl: 'https://dev-oa.vipthink.cn/oa/v2/api-docs?group=COMPLEX', // swagger config 接口路劲
  isLocalOpenRedis: false, // 是否开始redis存储swagger 配置（一般用于开发阶段）
  codeMap: {
    success: 20000, // 成功逻辑code
    unlogin: 40001, // 没有登录
    parameterError: 40003, //参数错误
  },
};

export default config;
