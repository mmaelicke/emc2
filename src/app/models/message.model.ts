export class Message {
  message: string;
  category: string;
  title: string;
  closeable: boolean;
  timeout: number;

  constructor(message, title, category, closeable, timeout?) {
    this.message = message;
    this.title = title;
    this.category = category;
    this.closeable = closeable;
    this.timeout = timeout;
  }
}
