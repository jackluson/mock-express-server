const config = {
  port: 9009, // 启动端口
  localPath: 'local', // 本地swagger 配置文件路径(遍历该文件下下面所有文件)
  selectedTag: '官网', // 对应swagger config 的tab，默认全部， 配置的话， 只启动该tag下面的接口
  swaggerUrl: 'https://dev-oa.vipthink.cn/oa/v2/api-docs?group=COMPLEX', // swagger config 接口路劲
  isLocalOpenRedis: false, // 是否开始redis存储swagger 配置（一般用于开发阶段）
  successCode: 30000, // 成功逻辑code
};

export default config;
