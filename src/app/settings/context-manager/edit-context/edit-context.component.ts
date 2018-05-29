import {Component, OnInit, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {ElasticsearchService} from '../../../shared/elasticsearch/elasticsearch.service';
import {Page} from '../../../models/page';
import {Context} from '../../../models/context.model';


@Component({
  selector: 'app-edit-context',
  templateUrl: './edit-context.component.html',
  styleUrls: ['./edit-context.component.css']
})
export class EditContextComponent implements OnInit {
  @ViewChild('f') contextForm: NgForm;
  data = {
    id: '',
    name: '',
    part_of: [],
    index: '',
    mapping: '',
  };
  contextsNames: string[] = [];
  editMode = false;


  constructor(private route: ActivatedRoute, private router: Router, private es: ElasticsearchService) { }

  ngOnInit() {
    // load the list of all contexts
    this.loadContextNames();

    // check if this is edit mode
    if (this.route.snapshot.params['id']) {
      this.editMode = true;
      this.data.mapping = 'Mapping Editing is not supported yet.';
      // console.log('edit Mode');

      // load the given context
      this.loadNewContext(this.route.snapshot.params['id']);
      this.route.params.subscribe(
        (params: Params) => {
          this.loadNewContext(params['id']);
        }
      );
    } else {
      // not in edit mode
      this.editMode = false;
      this.data.mapping = JSON.stringify(new Page().getDefault(), null, 4);
      // console.log('new Mode');
    }

  }

  loadContextNames() {
    // empty the contextNames array and load the current list
    this.contextsNames.length = 0;
    const contexts = this.es.getContexts();

    // Push all context names except 'global' and the current one
    for (const c of contexts) {
      if (c.name !== 'global' && c.name !== this.data.name) {
        this.contextsNames.push(c.name);
      }
    }
  }

  loadNewContext(index: number) {
    const context = this.es.getContexts()[index];

    this.data.id = context.id;
    this.data.name = context.name;
    this.data.part_of = context.part_of;
    this.data.index = context.index;
  }

  onSubmit() {
    // console.log(this.contextForm);
    // console.log(this.data);

    // if the submitted data does not have a index, create a new name
    if (!this.data.index) {
      this.data.index = this.data.name + '_' + Math.random().toString(36).substring(2, 7);
    }

    // create the Context and new Index.
    const context = new Context(this.data.id, this.data.name, this.data.part_of, this.data.index);
    if (this.editMode) {
      this.es.editContext(context);
    } else {
      this.es.createNewContext(context, this.data.mapping);
    }

    // reset the form and navigate away -> on Cancel does that.
    this.onCancel();
  }

  onCancel() {
    this.contextForm.reset();
    this.router.navigate(['settings']);
  }
}

