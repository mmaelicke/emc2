import {Component, OnDestroy, OnInit} from '@angular/core';
import {MessageService} from '../../shared/message.service';
import {Message} from '../../models/message.model';
import {Subscription} from 'rxjs/internal/Subscription';



@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  messageSubscription: Subscription;

  constructor(private messageService: MessageService) { }

  ngOnInit() {
    // get the current messages and subscribe to future changes
    this.messages = this.messageService.messages.getValue();
    this.messageSubscription = this.messageService.messages.subscribe(
      (messages: Message[]) => {
        this.messages = messages;
      }
    );
  }

  onRemoveMessage(index:number) {
    this.messageService.removeMessage(index);
  }

  ngOnDestroy() {
    this.messageSubscription.unsubscribe();
  }

}
