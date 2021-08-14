import fs from 'fs';
import path from 'path';
import marked from 'marked';
import pkgDir from 'pkg-dir';
import express, { Response, Request, NextFunction, Router } from 'express';

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
//   },
// });

// const upload = multer({ storage: storage });

const router = Router();
const projectRoot = pkgDir.sync(__dirname);
marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function (code, lang) {
    const hljs = require('highlight.js');
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false,
});

const renderer = new marked.Renderer();

renderer.image = function (href, title, alt) {
  return '<img style="max-width: 80%;" src="' + href + '" alt="' + alt + '"/>';
};

// 显示readme route处理
router.get('/readme', function (req, res) {
  const readmePath = path.join(projectRoot, 'RADME.md');
  const file = fs.readFileSync(readmePath, 'utf8');
  res.send(marked(file.toString(), { renderer: renderer }));
});
router.use('/screenshot', express.static(path.join(projectRoot, 'screenshot')));

router.use('/ui', express.static(path.join(projectRoot, 'ui')));
// router.get('/ui', function(req,res){

// })

router.get('/user', function (req: Request, res: Response, next: NextFunction) {
  res.download('./README.md', 'README.md', function (err) {
    if (err) {
      // Handle error, but keep in mind the response may be partially-sent
      // so check res.headersSent
    } else {
      // decrement a download credit, etc.
      const options = {
        root: './',
        dotfiles: 'deny',
        headers: {
          'x-timestamp': Date.now(),
          'x-sent': true,
        },
      };

      const fileName = './README.md';
      res.sendFile(fileName, options, function (err) {
        if (err) {
          return next(err);
        } else {
          console.log('Sent:', fileName);
        }
      });
    }
  });
});

router.get('/readme/download', function (req, res) {
  const file = `./README.md`;
  res.download(file, 'README.md'); // Set disposition and send it.
});

router.get('/fetch', function (req, res) {
  res.status(500).send({ error: 'filesomething blew up' });
  // res.set('Content-Type', 'text/html');
  // res.send(Buffer.from('whoop'));
});

router.post('/oa/v1/upload', function (req, res, next) {
  // form.parse(req, (err, fields, files) => {
  //   console.log(`: ----------------------------`);
  //   console.log(`fields, files`, fields, files);
  //   console.log(`: ----------------------------`);
  //   if (err) {
  //     next(err);
  //     return;
  //   }
  //   res.json({ fields, files });
  // });
  // res.set('Content-Type', 'text/html');
  // res.send(Buffer.from('whoop'));
});

export default router;
// app.get('/file/:name', function (req, res, next) {
//   var options = {
//     root: path.join(__dirname, 'public'),
//     dotfiles: 'deny',
//     headers: {
//       'x-timestamp': Date.now(),
//       'x-sent': true
//     }
//   }

//   var fileName = req.params.name
//   res.sendFile(fileName, options, function (err) {
//     if (err) {
//       next(err)
//     } else {
//       console.log('Sent:', fileName)
//     }
//   })
// })
