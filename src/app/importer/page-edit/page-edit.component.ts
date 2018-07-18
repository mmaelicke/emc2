import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Icon, LatLng, latLng, LatLngBounds, LeafletMouseEvent, Map, Marker, marker} from 'leaflet';
import {MaplayersService} from '../../shared/maplayers.service';
import {Page} from '../../models/page.model';
import {ElasticsearchService} from '../../shared/elasticsearch/elasticsearch.service';
import {Context} from '../../models/context.model';
import {Subscription} from 'rxjs/internal/Subscription';
import {Variables} from '../../shared/elasticsearch/elastic-response.model';

@Component({
  selector: 'app-page-edit',
  templateUrl: './page-edit.component.html',
  styleUrls: ['./page-edit.component.css'],
})
export class PageEditComponent implements OnInit, OnDestroy {
  @Input() context: Context;
  pageForm: FormGroup;
  supplementary: FormArray;

  // if started in edit mode, the page is set as property
  page: Page;

  // form elements
  // variables = ['air temperature', 'air pressure', 'relative humidity'];
  variables: Variables[] = [];
  variablesSubscription: Subscription;
  newVariable = '';

  // leaflet map setup
  activeCoordinate = latLng([48.000, 7.8212]);
  icon = new Icon({iconUrl: '../assets/img/marker.png', iconSize: [64, 64], iconAnchor: [32, 64]});
  markerLayer = marker(this.activeCoordinate, {icon: this.icon});
  mapLayers = [this.layerService.layer.terrain, this.markerLayer];
  fitBounds: LatLngBounds;

  constructor(private layerService: MaplayersService, private changeDetector: ChangeDetectorRef,
              private es: ElasticsearchService) { }

  ngOnInit() {
    // as soon as editing is implemented, check edit mode here
    this.initEmptyForm();
    this.onCoordinateChanged();

    // load the variables
    this.variables = this.es.variables.getValue();
    this.variablesSubscription = this.es.variables.subscribe(
      (variables: Variables[]) => {
        this.variables = variables;
      }
    );
  }

  onAddSupplementary() {
    // new input field for the supplementary name
    (<FormArray>this.pageForm.get('supplementary')).push(
      new FormGroup({
        key: new FormControl(null, {validators: [Validators.required]}),
        value: new FormControl(null, {validators: [Validators.required]}),
      })
    );
  }

  onRemoveSupplementary(index: number) {
    (<FormArray>this.pageForm.get('supplementary')).removeAt(index);
  }

  onAddNewVariable(event?) {
    if (event) {
      if (event.key === 'Enter') {
        this.onAddNewVariable(null);
      }
    } else {
      // add the new variable and empty the input
      this.variables.push({name: this.newVariable, count: 0});
      this.pageForm.get('variable').setValue(this.newVariable);
      this.newVariable = '';
    }
  }

  onCoordinateChanged() {
    const lat = (<FormControl>this.pageForm.get('coordinates.lat')).value;
    const lon = (<FormControl>this.pageForm.get('coordinates.lon')).value;

    // if both are set, update the map
    if (lat && lon) {
      this.activeCoordinate = latLng([lat, lon]);
      // this.mapLayers = [this.layerService.layer.terrain, marker(this.activeCoordinate, {icon: this.icon})];
      this.markerLayer.setLatLng(this.activeCoordinate);
      this.changeDetector.detectChanges();

      // update location
      this.pageForm.get('location').setValue('POINT (' + lon + ' ' + lat + ')');
    }
  }

  onMapReady(map: Map) {

    map.on('click', (e: LeafletMouseEvent) => {
      this.pageForm.get('coordinates.lat').setValue(e.latlng.lat);
      this.pageForm.get('coordinates.lon').setValue(e.latlng.lng);
      this.onCoordinateChanged();
    });
  }

  initEmptyForm() {
    let s = new FormArray([]);
    this.supplementary = s;
    this.pageForm = new FormGroup({
      id: new FormControl(),
      title: new FormControl(null, {validators: [ Validators.required ]}),
      identifiers: new FormControl('', []),
      description: new FormControl(null),
      variable: new FormControl(null),
      license: new FormControl(),
      owner: new FormControl(),
      attribution: new FormControl(),
      coordinates: new FormGroup({
        lat: new FormControl(),
        lon: new FormControl()
      }),
      location: new FormControl({value: '', disabled: true}),
      created: new FormControl(),
      edited: new FormControl(),
      supplementary: s,
      file: new FormControl()
    });
  }

  onSubmit() {
    let editPage: Page;
    const value = this.pageForm.value;

    if (this.page) {
      editPage = this.page;
      editPage.edited = new Date();
    } else {
      editPage = new Page();
      editPage.created = new Date();
      editPage.edited = editPage.created;
    }

    // set the Form properties
    editPage.id = value.id;
    editPage.title = value.title;
    editPage.identifiers = [];
    if (value.identifiers) {
      value.identifiers.forEach(e =>  editPage.identifiers.push(e.value));
    }
    editPage.description = value.description;
    editPage.variable = value.variable;
    editPage.license = value.license;
    editPage.attribution = value.attribution;
    editPage.owner = value.owner;
    editPage.coordinates = value.coordinates;
    editPage.location = value.location;
    editPage.supplementary = {};
    if (value.supplementary) {
      value.supplementary.forEach(e => editPage.supplementary[e.key] = e.value);
    }

    // check if there is a Context
    if (!this.context) {
      console.log('[PAGE-EDIT] I lost the active context...');
    }

    // create the Page
    this.es.createPage(editPage, this.context);
    // console.log(editPage);

    // TODO: change this to a routing to the overview Page as soon as I implemented this
    // until then, just cancel the form
    this.onCancel();
  }

  onCancel() {
    this.pageForm.reset();
  }

  ngOnDestroy() {
    this.variablesSubscription.unsubscribe();
  }

}
