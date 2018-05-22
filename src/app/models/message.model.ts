export class Message {
  message: string;
  category: string;
  title: string;
  closeable: boolean;

  constructor(message, title, category, closeable) {
    this.message = message;
    this.title = title;
    this.category = category;
    this.closeable = closeable;
  }
}
