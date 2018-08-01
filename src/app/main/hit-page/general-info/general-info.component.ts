import {Component, Input, OnInit} from '@angular/core';
import {Hit} from '../../../shared/elasticsearch/hit.model';
import {MaplayersService} from '../../../shared/maplayers.service';
import {Icon, LatLng, latLng, marker} from 'leaflet';

@Component({
  selector: 'app-general-info',
  templateUrl: './general-info.component.html',
  styleUrls: ['./general-info.component.css']
})
export class GeneralInfoComponent implements OnInit {
  @Input() hit: Hit;

  // map stuff
  coordinate: LatLng;
  mapLayers: any[] = [];

  constructor(private layerService: MaplayersService) { }

  ngOnInit() {
    if (this.hit.coordinates) {
      const icon = new Icon({iconUrl: '../assets/img/marker.png', iconSize: [64, 64], iconAnchor: [32, 64]});
      this.coordinate = latLng([this.hit.coordinates.lat, this.hit.coordinates.lon]);
      this.mapLayers = [
        this.layerService.layer.terrain,
        marker(this.coordinate, {icon: icon})
      ];
    } else {
      console.log('The hit does not have coordinates associated.');
    }
      }

}
