import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Icon, LatLng, latLng, LatLngBounds, LeafletMouseEvent, Map, Marker, marker} from 'leaflet';
import {MaplayersService} from '../../shared/maplayers.service';

@Component({
  selector: 'app-page-edit',
  templateUrl: './page-edit.component.html',
  styleUrls: ['./page-edit.component.css'],
})
export class PageEditComponent implements OnInit {
  variables = ['air temperature', 'air pressure', 'relative humidity'];
  newVariable = '';

  activeCoordinate = latLng([48.000, 7.8212]);
  icon = new Icon({iconUrl: '../assets/img/marker.png', iconSize: [64, 64], iconAnchor: [32, 64]});

  markerLayer = marker(this.activeCoordinate, {icon: this.icon});
  mapLayers = [this.layerService.layer.terrain, this.markerLayer];
  fitBounds: LatLngBounds;

  pageForm: FormGroup;

  constructor(private layerService: MaplayersService, private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    // as soon as editing is implemented, check edit mode here
    this.initEmptyForm();
    this.onCoordinateChanged();
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
      this.variables.push(this.newVariable);
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
      this.pageForm.get('location').setValue('POINT (' + lon + ' ' + lon + ')');
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
    this.pageForm = new FormGroup({
      id: new FormControl(),
      title: new FormControl(null, {validators: [ Validators.required ]}),
      identifiers: new FormControl('', []),
      description: new FormControl(null, {validators: [ Validators.required ]}),
      variable: new FormControl(null, {validators: [ Validators.required ]}),
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
      supplementary: new FormArray([]),
      file: new FormControl()
    });
  }

  onSubmit() {
    console.log(this.pageForm);
  }

  onCancel() {
    this.pageForm.reset();
  }

}
