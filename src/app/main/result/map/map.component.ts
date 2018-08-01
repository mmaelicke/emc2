import {Component, OnDestroy, OnInit} from '@angular/core';
import {MaplayersService} from '../../../shared/maplayers.service';
import {ElasticsearchService} from '../../../shared/elasticsearch/elasticsearch.service';
import {Hit} from '../../../shared/elasticsearch/hit.model';
import {Icon, latLng, Layer, LayerGroup, Map, marker, Marker} from 'leaflet';
import {Subscription} from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
  hits: Hit[] = [];
  hitSubscription: Subscription;
  hitsWithoutCoord = 0;

  // map stuff
  defaultIcon = new Icon({iconUrl: '../assets/img/marker.png', iconSize: [64, 64], iconAnchor: [32, 64]});
  // coordinate Layer
  currentMarkers: Marker[] = [];
  coordinateLayer: LayerGroup;
  layerControl: {baseLayers: {}, overlays: {}};
  mapLayers: any[] = [];
  layerControlOptions = {
    collapsed: true,
    hideSingleBase: false
  };

  constructor(private layerService: MaplayersService, private es: ElasticsearchService) { }

  ngOnInit() {
    // get the hits and subscribe
    this.hits = this.es.hits.getValue();
    this.hitSubscription = this.es.hits.subscribe(
      (hits: Hit[]) => {
        this.hits = hits;
        this.createCoordinateLayer();
      }
    );

    // build the map
    this.layerControl = {
      baseLayers: {
        'Stamen Terrain': this.layerService.layer.terrain,
        'Stamen Toner': this.layerService.layer.toner
      },
      overlays: {}
    };

  }

  private createCoordinateLayer() {
    // empty the coordinateLayer
    this.hitsWithoutCoord = 0;
    this.currentMarkers.length = 0;

    // build a list of coordinates from the hit list
    for (const hit of this.hits) {
      if (!hit.coordinates) {
        this.hitsWithoutCoord += 1;
      } else {
        this.currentMarkers.push(
          marker(latLng(hit.coordinates.lat, hit.coordinates.lon), {icon: this.defaultIcon})
        );
      }
    }

    // check if there are coordinates
    if (this.currentMarkers.length > 0) {
      this.coordinateLayer = new LayerGroup(this.currentMarkers);
      this.layerControl.overlays['Results'] = this.coordinateLayer;
      this.mapLayers = [this.coordinateLayer];
    }
  }

  onMapReady(map: Map) {
    // re-add the Terrain for preselecting it.
    map.addLayer(this.layerControl.baseLayers['Stamen Terrain']);
  }

  ngOnDestroy() {
    this.hitSubscription.unsubscribe();
  }

}
