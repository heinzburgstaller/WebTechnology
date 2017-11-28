export class Message {

  public static readonly TYPE_CONNECTION_ESTABLISHED: string = 'connectionEstablished';

  type: string;

  constructor(type: string) {
    this.type = type;
  }
}
