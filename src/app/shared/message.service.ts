import {Injectable} from '@angular/core';
import {Message} from '../models/message.model';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

@Injectable()
export class MessageService {
  private _messages: Message[] = [];
  messages = new BehaviorSubject<Message[]>(this._messages);

  // counter
  errorCount = new BehaviorSubject<number>(0);
  warningCount = new BehaviorSubject<number>(0);

  private addMessage(message: Message) {
    // add the new message and emit the new list
    this._messages.push(message);

    // check if the message has a timeout
    if (message.timeout) {
      const index = this._messages.length - 1;
      setTimeout(() => {
        this.removeMessage(index);
      }, message.timeout);
    }
    this.messages.next(this._messages);
  }

  removeMessage(index: number) {
    // remove the message at index and emit the mew list
    this._messages.splice(index, 1);
    this.messages.next(this._messages);
  }

  success(message: string, title= 'Success', closeable= true, timeout= 20000) {
    // add a message with success category
    const messageObject = new Message(message, title, 'success', closeable, timeout);
    this.addMessage(messageObject);
  }

  error(message: string, title= 'Error', closeable= true, timeout?) {
    // add a message with danger category
    const messageObject = new Message(message, title,'danger', closeable, timeout);
    this.addMessage(messageObject);
    this.errorCount.next(this.errorCount.getValue() + 1);
  }

  warning(message: string, title='Warning', closeable= true, timeout?) {
    // add a message with warning category
    const messageObject = new Message(message, title, 'warning', closeable, timeout);
    this.addMessage(messageObject);
    this.warningCount.next(this.warningCount.getValue() + 1);
  }

  info(message: string, title='Info', closeable= true, timeout?) {
    // add a message with info category
    const messageObject = new Message(message, title, 'info', closeable, timeout);
    this.addMessage(messageObject);
  }



}
