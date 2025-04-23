import * as bcrypt from 'bcrypt';

export class Hash {
  static make(plainText) {
    const salt = bcrypt.genSaltSync();
    return bcrypt.hashSync(plainText, salt);
  }

  static compare(plainText, hashText) {
    return bcrypt.compareSync(plainText, hashText);
  }
}
