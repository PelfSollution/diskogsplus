var CryptoJS = require("crypto-js");

export const encrypt = (text: string): string => {
    if (!process.env.CRYPT_KEY) {
        throw new Error("La clave de encriptación no está definida");
    }

    const ciphertext = CryptoJS.AES.encrypt(
        text, 
        process.env.CRYPT_KEY
    ).toString();

    return ciphertext;
};

export const decrypt = (ciphertext: string): string => {
    if (!process.env.CRYPT_KEY) {
        throw new Error("La clave de encriptación no está definida");
    }

    const bytes  = CryptoJS.AES.decrypt(ciphertext, process.env.CRYPT_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);

    return originalText;
};
