import path from 'path';
import fs from 'fs';

// Custom promisify
export const promisify = (fn) => {
  /**
   * @param {...Any} params The params to pass into *fn*
   * @return {Promise<Any|Any[]>}
   */
  return function promisified(...params) {
    return new Promise((resolve, reject) =>
      fn(...params.concat([(err, ...args) => (err ? reject(err) : resolve(args.length < 2 ? args[0] : args))])),
    );
  };
};

/**
 * traverse directory or file
 *
 * @param {*} pathRoad -- dir or filepath
 * @returns Promise
 */
export const walk = async (pathRoad) => {
  const readDirAsync = promisify(fs.readdir);
  const lstatAsync = promisify(fs.lstat);

  const statInfo = (await lstatAsync(pathRoad)) as fs.Stats;

  if (statInfo.isFile()) {
    return lstatAsync(pathRoad).then((stat: fs.Stats) => {
      if (stat.isDirectory()) {
        return walk(pathRoad);
      } else {
        return [pathRoad];
      }
    });
  }

  return readDirAsync(pathRoad)
    .then((files: []) => {
      return Promise.all(
        files.map((f) => {
          const file = path.join(pathRoad, f);
          return lstatAsync(file).then((stat: fs.Stats) => {
            if (stat.isDirectory()) {
              return walk(file);
            } else {
              return [file];
            }
          });
        }),
      );
    })
    .then((files) => {
      return files.reduce((pre: [], cur: any) => pre.concat(cur), []);
    });
};
