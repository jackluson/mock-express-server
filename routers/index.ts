import path from 'path';
import { Response, Request, NextFunction, Router } from 'express';

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

router.get('/download', function (req, res) {
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
