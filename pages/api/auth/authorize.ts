var Discogs = require('disconnect').Client;
import { NextApiRequest, NextApiResponse } from 'next';
import { setCookie } from 'cookies-next';
var CryptoJS = require('crypto-js');



export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Hello World' });
}

